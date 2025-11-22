import 'dotenv/config';
import { searchMarketplace } from './scraper';

async function simpleTest() {
  console.log('🧪 Simple description test\n');

  // First: Get listings WITHOUT descriptions
  console.log('Step 1: Getting listings (no descriptions)...');
  const listings = await searchMarketplace({
    query: 'סירה',
    location: 'telaviv',
    radius: 100
  });

  console.log(`✅ Found ${listings.length} listings\n`);

  // Show first 3
  console.log('First 3 listings:');
  listings.slice(0, 3).forEach((l, i) => {
    console.log(`  ${i + 1}. ${l.title} - ${l.price} (ID: ${l.id})`);
  });

  // Now: Fetch descriptions for ONLY the first 2 listings
  console.log('\n\nStep 2: Fetching descriptions for first 2 listings...\n');

  const testListings = listings.slice(0, 2);

  const detailedResults = await searchMarketplace(
    {
      query: 'סירה',
      location: 'telaviv',
      radius: 100
    },
    {
      fetchDescriptions: true  // This will fetch ALL, but we'll stop after showing 2
    }
  );

  console.log('\n\n=== RESULTS ===\n');

  detailedResults.slice(0, 2).forEach((listing, i) => {
    console.log(`\n${i + 1}. ${listing.title}`);
    console.log(`   💰 ${listing.price}`);
    console.log(`   📍 ${listing.location.city}`);
    console.log(`   🔗 ${listing.url}`);

    if (listing.description) {
      console.log(`   📝 Description:\n      ${listing.description}`);
    } else {
      console.log(`   ⚠️  No description`);
    }
  });

  console.log('\n\n✅ Done!');
}

simpleTest().catch(console.error);
