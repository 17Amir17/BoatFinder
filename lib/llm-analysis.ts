import Anthropic from "@anthropic-ai/sdk";
import { MarketplaceListing } from "../src/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface LLMAnalysis {
  hasParking: boolean;
  rating: number;
  reason: string;
}

/**
 * Analyze a boat listing using Claude to extract parking info and rate the listing
 */
export async function analyzeListingWithLLM(
  listing: MarketplaceListing
): Promise<LLMAnalysis> {
  const prompt = `You are analyzing a boat listing to determine if it matches specific criteria.

TARGET CRITERIA:
- Power Category: עוצמה א (otzma alef / power A) - Israeli boat licensing category
- Length: Up to 7 meters (the closes to 7 the better)
- Engine Power: Up to 150 HP (the closes to 150 the better)
- Marina Parking: Must mention marina parking/berth/mooring space (מקום עגינה במרינה) CRITICAL!
- Ideal Price: Around ₪60,000 (flexible, but the closer to ₪60,000 the better)

LISTING TO ANALYZE:
- Title: ${listing.title}
- Price: ${listing.price}
${
  listing.strikethrough_price
    ? `- Original Price: ${listing.strikethrough_price}`
    : ""
}
- Location: ${listing.location.city}, ${listing.location.state}
${
  listing.description
    ? `- Description: ${listing.description}`
    : "- Description: Not available"
}

TASK:
1. Extract boat specifications from the Hebrew text (length in meters, HP, power category)
2. Check if MARINA PARKING is mentioned - this means a berth/mooring spot in a marina (מקום עגינה, מקום במרינה, מרינה משולם, עגינה).
   IMPORTANT: Car parking (חניה לרכב) does NOT count - we only care about boat mooring space in a marina!
3. Rate from 0-10 how well this boat matches the criteria:
   - 10 = Perfect match (עוצמה א, ≤7m, ≤150HP, has marina parking, ~₪60k)
   - 7-9 = Good match (meets most criteria)
   - 4-6 = Partial match (meets some criteria)
   - 0-3 = Poor match (doesn't meet key criteria)
4. Provide clear reasoning explaining what specs you found and how it matches

Respond in JSON format only:
{
  "hasParking": boolean (true = has marina berth/mooring, false = no marina spot mentioned),
  "rating": number (0-10),
  "reason": "Detailed explanation in English: Found specs: [length/HP/power category], marina parking: [yes/no/what was found], price: [assessment]. Rating because..."
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      hasParking: analysis.hasParking === true,
      rating: Math.max(0, Math.min(10, parseInt(analysis.rating) || 0)),
      reason: analysis.reason || "No reason provided",
    };
  } catch (error: any) {
    console.error(
      `Error analyzing listing ${listing.id}:`,
      error?.message || error
    );

    // Return default values on error
    return {
      hasParking: false,
      rating: 5,
      reason: "Analysis failed: " + (error?.message || "Unknown error"),
    };
  }
}

/**
 * Analyze multiple listings in batch (with rate limiting)
 */
export async function analyzeListingsBatch(
  listings: MarketplaceListing[]
): Promise<Map<string, LLMAnalysis>> {
  const results = new Map<string, LLMAnalysis>();

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];

    console.log(`   [${i + 1}/${listings.length}] Analyzing: ${listing.title}`);

    const analysis = await analyzeListingWithLLM(listing);
    results.set(listing.id, analysis);

    // Add delay to respect rate limits
    if (i < listings.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
