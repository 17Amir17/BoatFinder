/**
 * Example usage of the Facebook Marketplace scraper
 *
 * This shows how to use the searchMarketplace function to find listings
 */

import "dotenv/config";
import { searchMarketplace, MarketplaceListing } from "./src";

async function main() {
  // Example 1: Search for boats in Israel with descriptions
  const results: MarketplaceListing[] = await searchMarketplace(
    {
      query: "סירה",
      location: "telaviv",
      radius: 250, // Search within 250km radius
    },
    {
      fetchDescriptions: true, // Fetch full descriptions from item pages (slower but more detailed)
    }
  );

  console.log(`Found ${results.length} listings`);

  // Access the typed data
  results.forEach((listing) => {
    console.log(`
Title: ${listing.title}
Price: ${listing.price}
${listing.strikethrough_price ? `Original: ${listing.strikethrough_price}` : ""}
Location: ${listing.location.city}, ${listing.location.state}
${listing.description ? `Description: ${listing.description}` : ""}
URL: ${listing.url}
Delivery: ${listing.delivery_types?.join(", ") || "N/A"}
Status: ${listing.is_sold ? "SOLD" : "Available"}
    `);
  });

  // Return the raw data array for further processing
  return results;
}

main().catch(console.error);
