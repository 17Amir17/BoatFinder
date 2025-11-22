import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchMarketplace, fetchListingDescription } from "../../src/scraper";
import { getExistingListingIds, insertListing } from "../../lib/db";
import {
  isInPriceRange,
  DEFAULT_PRICE_RANGE,
  formatPrice,
} from "../../lib/filters";
import { analyzeListingWithLLM } from "../../lib/llm-analysis";

// Search queries to run daily (8 AM UTC = 10/11 AM Israel time depending on DST)
const SEARCH_QUERIES = [
  { query: "סירה", description: "boats" },
  { query: "סירת דייג", description: "fishing boat" },
  { query: "עוצמה א", description: "power A" },
];

const SEARCH_LOCATION = "telaviv";
const SEARCH_RADIUS = 250; // km

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("🚀 Starting daily boat search...");
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    // RUN ALL SEARCHES IN PARALLEL
    console.log(
      `\n⚡ Running ${SEARCH_QUERIES.length} searches in PARALLEL...\n`
    );

    const searchResults = await Promise.all(
      SEARCH_QUERIES.map(async ({ query, description }) => {
        console.log(`🔍 "${query}" (${description})...`);

        try {
          const listings = await searchMarketplace({
            query,
            location: SEARCH_LOCATION,
            radius: SEARCH_RADIUS,
          });

          console.log(`✅ "${query}": ${listings.length} listings`);
          return { query, description, listings, error: null };
        } catch (error: any) {
          console.error(`❌ "${query}": ${error?.message}`);
          return { query, description, listings: [], error: error?.message };
        }
      })
    );

    // BATCH CHECK: Get ALL listing IDs from ALL searches at once
    const allListings = searchResults.flatMap((r) => r.listings);
    const allIds = allListings.map((l) => l.id);
    const uniqueIds = [...new Set(allIds)]; // Remove duplicates across searches
    const existingIds = await getExistingListingIds(uniqueIds);

    console.log(`\n📊 Combined results:`);
    console.log(`   Total listings: ${allListings.length}`);
    console.log(`   Unique listings: ${uniqueIds.length}`);
    console.log(`   Already in DB: ${existingIds.size}`);
    console.log(`   New to process: ${uniqueIds.length - existingIds.size}`);

    // Get unique new listings (dedupe by ID)
    const newListingsMap = new Map();
    const listingQueryMap = new Map<string, string>();

    for (const { query, listings } of searchResults) {
      for (const listing of listings) {
        if (!existingIds.has(listing.id) && !newListingsMap.has(listing.id)) {
          newListingsMap.set(listing.id, listing);
          listingQueryMap.set(listing.id, query);
        }
      }
    }

    const allNewListings = Array.from(newListingsMap.values());

    if (allNewListings.length === 0) {
      console.log("\n✓ No new listings to process");

      const results = searchResults.map(({ query, listings }) => ({
        query,
        total: listings.length,
        new: 0,
        inPriceRange: 0,
        notified: [],
      }));

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      });
    }

    // OPTIMIZATION: Only fetch descriptions for listings in price range
    const inPriceRangeListings = allNewListings.filter(l =>
      isInPriceRange(l, DEFAULT_PRICE_RANGE.min, DEFAULT_PRICE_RANGE.max)
    );

    console.log(
      `\n⚡ ${allNewListings.length} new listings (${inPriceRangeListings.length} in price range)`
    );
    console.log(`   Fetching descriptions for ${inPriceRangeListings.length} in PARALLEL...\n`
    );

    const descriptions = await Promise.all(
      inPriceRangeListings.map(async (listing, index) => {
        console.log(`  [${index + 1}/${inPriceRangeListings.length}] ${listing.title}`);
        try {
          const description = await fetchListingDescription(listing.id);
          return { id: listing.id, description };
        } catch (error: any) {
          console.error(`     ❌ Error: ${error?.message}`);
          return { id: listing.id, description: undefined };
        }
      })
    );

    // Add descriptions to listings
    const descriptionMap = new Map(descriptions.map(d => [d.id, d.description]));
    allNewListings.forEach(listing => {
      listing.description = descriptionMap.get(listing.id);
    });

    console.log(`✅ Fetched ${descriptions.filter(d => d.description).length}/${inPriceRangeListings.length} descriptions`);

    // STEP 2: RUN LLM ANALYSIS ONLY ON PRICE-RANGE LISTINGS IN PARALLEL
    console.log(
      `\n⚡ Running LLM analysis on ${inPriceRangeListings.length} listings in PARALLEL...\n`
    );

    const analyses = await Promise.all(
      inPriceRangeListings.map(async (listing, index) => {
        console.log(`  [${index + 1}/${inPriceRangeListings.length}] ${listing.title}`);
        try {
          const analysis = await analyzeListingWithLLM(listing);
          console.log(`     ✅ ${analysis.rating}/10, Parking: ${analysis.hasParking}`);
          return { id: listing.id, analysis };
        } catch (error: any) {
          console.error(`     ❌ Error: ${error?.message}`);
          return {
            id: listing.id,
            analysis: { hasParking: false, rating: 0, reason: 'Analysis failed' }
          };
        }
      })
    );

    // Add LLM results to in-range listings
    const analysisMap = new Map(analyses.map(a => [a.id, a.analysis]));
    inPriceRangeListings.forEach(listing => {
      const analysis = analysisMap.get(listing.id);
      if (analysis) {
        listing.hasParking = analysis.hasParking;
        listing.llm_rating = analysis.rating;
        listing.llm_reason = analysis.reason;
      }
    });

    console.log(`✅ Completed ${inPriceRangeListings.length} LLM analyses`);

    // STEP 3: SAVE ALL TO DATABASE IN PARALLEL
    console.log(
      `\n⚡ Saving ${allNewListings.length} listings to DB in PARALLEL...\n`
    );

    await Promise.all(
      allNewListings.map(async (listing) => {
        try {
          await insertListing(listing, listingQueryMap.get(listing.id) || "");
        } catch (error: any) {
          console.error(`     ❌ DB Error for ${listing.title}: ${error?.message}`);
        }
      })
    );

    console.log(`✅ Saved all listings to database`);

    // STEP 4: SEND DISCORD NOTIFICATIONS IN PARALLEL
    const notificationsToSend = allNewListings.filter(listing =>
      isInPriceRange(listing, DEFAULT_PRICE_RANGE.min, DEFAULT_PRICE_RANGE.max)
    );

    if (notificationsToSend.length > 0) {
      console.log(
        `\n⚡ Sending ${notificationsToSend.length} Discord notifications in PARALLEL...\n`
      );

      await Promise.all(
        notificationsToSend.map(async (listing) => {
          try {
            await sendDiscordNotification(listing);
          } catch (error: any) {
            console.error(`     ❌ Discord error: ${error?.message}`);
          }
        })
      );
    }

    console.log(`\n✅ All listings processed!`);

    // Build results summary
    const results = searchResults.map(({ query, listings }) => {
      const newForQuery = listings.filter((l) => newListingsMap.has(l.id));
      const notified = newForQuery.filter((l) =>
        isInPriceRange(l, DEFAULT_PRICE_RANGE.min, DEFAULT_PRICE_RANGE.max)
      );

      return {
        query,
        total: listings.length,
        new: newForQuery.length,
        inPriceRange: notified.length,
        notified: notified.map((l) => l.title),
      };
    });

    // Log summary
    for (const r of results) {
      console.log(`\n📊 "${r.query}":`);
      console.log(
        `   Total: ${r.total}, New: ${r.new}, Notified: ${r.inPriceRange}`
      );
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error("❌ Fatal error:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Send Discord notification
 */
async function sendDiscordNotification(listing: any): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(`     📬 No webhook URL, skipping Discord notification`);
    return;
  }

  try {
    const embed = {
      title: listing.title,
      url: listing.url,
      color: listing.llm_rating >= 7 ? 0x00ff00 : 0x0099ff, // Green for high ratings
      fields: [
        { name: "💰 Price", value: listing.price, inline: true },
        {
          name: "📍 Location",
          value: `${listing.location.city}, ${listing.location.state}`,
          inline: true,
        },
        {
          name: "⭐ LLM Rating",
          value: `${listing.llm_rating}/10`,
          inline: true,
        },
        {
          name: "🅿️ Parking",
          value: listing.hasParking ? "✅ Yes" : "❌ No",
          inline: true,
        },
        { name: "📝 LLM Analysis", value: listing.llm_reason, inline: false },
      ],
      timestamp: new Date().toISOString(),
    };

    if (listing.description) {
      embed.fields.push({
        name: "📄 Description",
        value: listing.description.substring(0, 1000),
        inline: false,
      });
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    console.log(`     📬 Discord notification sent!`);
  } catch (error: any) {
    console.error(`     ❌ Discord error: ${error?.message}`);
  }
}
