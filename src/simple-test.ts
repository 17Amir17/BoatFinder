import 'dotenv/config';
import { searchMarketplace } from './scraper';
import { displayListings } from './parser';

async function simpleTest() {
  console.log('🚀 Testing Facebook Marketplace Search\n');

  try {
    console.log('Searching for boats in Tel Aviv...\n');

    const results = await searchMarketplace({
      query: 'boat',
      location: 'tel-aviv-israel'
    });

    console.log('\n📊 RESULTS:\n');
    displayListings(results);

    console.log('\n\n✅ Test completed successfully!');
    console.log(`📈 Total listings found: ${results.length}`);

    // Show the raw data structure of first listing
    if (results.length > 0) {
      console.log('\n📋 Example listing data structure:');
      console.log(JSON.stringify(results[0], null, 2));
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error?.message || error);
    process.exit(1);
  }
}

if (!process.env.CRAWLBASE_TOKEN) {
  console.error('❌ Error: CRAWLBASE_TOKEN not found');
  process.exit(1);
}

simpleTest();
