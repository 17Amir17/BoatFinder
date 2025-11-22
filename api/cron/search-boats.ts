import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchMarketplace } from '../../src/scraper';
import { listingExists, insertListing, initializeDatabase } from '../../lib/db';
import { isInPriceRange, DEFAULT_PRICE_RANGE, formatPrice } from '../../lib/filters';
import { analyzeListingWithLLM } from '../../lib/llm-analysis';
import { MarketplaceListing } from '../../src/types';

// Search queries to run every hour
const SEARCH_QUERIES = [
  { query: 'סירה', description: 'boats' },
  { query: 'סירת דייג', description: 'fishing boat' }
];

const SEARCH_LOCATION = 'telaviv';
const SEARCH_RADIUS = 250; // km

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🚀 Starting hourly boat search...');
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    // Initialize database if needed
    await initializeDatabase();

    const results: {
      query: string;
      total: number;
      new: number;
      inPriceRange: number;
      notified: string[];
    }[] = [];

    // Run each search query
    for (const { query, description } of SEARCH_QUERIES) {
      console.log(`\n🔍 Searching for "${query}" (${description})...`);

      try {
        // Search without descriptions first
        const listings = await searchMarketplace({
          query,
          location: SEARCH_LOCATION,
          radius: SEARCH_RADIUS
        });

        console.log(`✅ Found ${listings.length} total listings`);

        let newCount = 0;
        let inRangeCount = 0;
        const notifiedListings: string[] = [];

        // Process each listing
        for (const listing of listings) {
          // Check if listing already exists
          const exists = await listingExists(listing.id);

          if (exists) {
            // Skip existing listings
            continue;
          }

          // New listing!
          newCount++;
          console.log(`  ✨ NEW: ${listing.title} - ${listing.price}`);

          // Fetch description for new listings
          console.log(`     Fetching description...`);
          const detailedListings = await searchMarketplace(
            { query, location: SEARCH_LOCATION, radius: SEARCH_RADIUS },
            { fetchDescriptions: true }
          );

          // Find this specific listing with description
          const detailedListing = detailedListings.find(l => l.id === listing.id);

          if (detailedListing?.description) {
            listing.description = detailedListing.description;
            console.log(`     ✅ Description fetched`);
          }

          // Run LLM analysis
          console.log(`     Analyzing with LLM...`);
          const analysis = await analyzeListingWithLLM(listing);

          // Add LLM results to listing
          listing.hasParking = analysis.hasParking;
          listing.llm_rating = analysis.rating;
          listing.llm_reason = analysis.reason;

          console.log(`     ✅ LLM Analysis: Rating ${analysis.rating}/10, Parking: ${analysis.hasParking}`);

          // Insert into database
          await insertListing(listing, query);

          // Check if in price range for notification
          if (isInPriceRange(listing, DEFAULT_PRICE_RANGE.min, DEFAULT_PRICE_RANGE.max)) {
            inRangeCount++;

            // Log for notification (Discord webhook would go here)
            console.log(`\n🎯 NOTIFICATION CANDIDATE:`);
            console.log(`   Title: ${listing.title}`);
            console.log(`   Price: ${listing.price}`);
            console.log(`   Location: ${listing.location.city}, ${listing.location.state}`);
            console.log(`   LLM Rating: ${listing.llm_rating}/10`);
            console.log(`   Has Parking: ${listing.hasParking ? 'YES' : 'NO'}`);
            console.log(`   LLM Reason: ${listing.llm_reason}`);
            console.log(`   URL: ${listing.url}`);

            if (listing.description) {
              console.log(`   Description: ${listing.description.substring(0, 100)}...`);
            }

            notifiedListings.push(listing.title);

            // TODO: Send Discord webhook
            // await sendDiscordNotification(listing);
          }
        }

        results.push({
          query,
          total: listings.length,
          new: newCount,
          inPriceRange: inRangeCount,
          notified: notifiedListings
        });

        console.log(`\n📊 Summary for "${query}":`);
        console.log(`   Total: ${listings.length}`);
        console.log(`   New: ${newCount}`);
        console.log(`   In price range (${formatPrice(DEFAULT_PRICE_RANGE.min)}-${formatPrice(DEFAULT_PRICE_RANGE.max)}): ${inRangeCount}`);

      } catch (error: any) {
        console.error(`❌ Error searching for "${query}":`, error?.message || error);

        results.push({
          query,
          total: 0,
          new: 0,
          inPriceRange: 0,
          notified: []
        });
      }

      // Add delay between searches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ Hourly search completed!');

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error: any) {
    console.error('❌ Fatal error:', error);

    return res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Send Discord notification (placeholder for future implementation)
 */
async function sendDiscordNotification(listing: MarketplaceListing): Promise<void> {
  // TODO: Implement Discord webhook
  // const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  // if (!webhookUrl) return;
  //
  // await fetch(webhookUrl, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     embeds: [{
  //       title: listing.title,
  //       description: listing.description || 'No description',
  //       url: listing.url,
  //       color: 0x0099ff,
  //       fields: [
  //         { name: 'Price', value: listing.price, inline: true },
  //         { name: 'Location', value: `${listing.location.city}, ${listing.location.state}`, inline: true }
  //       ]
  //     }]
  //   })
  // });

  console.log(`📬 Would send Discord notification for: ${listing.title}`);
}
