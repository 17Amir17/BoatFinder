import { parseMarketplaceListings, displayListings } from './parser';
import * as fs from 'fs';

// Test the parser with saved HTML
const html = fs.readFileSync('response_marketplace_search___boats_in_tel_aviv.html', 'utf-8');

console.log('🧪 Testing parser with saved HTML from Tel Aviv search\n');

const listings = parseMarketplaceListings(html);

displayListings(listings);

console.log('\n✅ Parser test complete!');
console.log(`📈 Total listings found: ${listings.length}`);

if (listings.length > 0) {
  console.log('\n📋 Example listing data structure:');
  console.log(JSON.stringify(listings[0], null, 2));
}
