import 'dotenv/config';
import { searchMarketplace } from './scraper';
import { displayListings } from './parser';

async function testRadius() {
  console.log('🧪 Testing radius parameter\n');

  try {
    // Test with radius
    console.log('================================================================================');
    console.log('TEST: Searching for boats in Tel Aviv with 250km radius');
    console.log('================================================================================\n');

    const results = await searchMarketplace({
      query: 'boats',
      location: 'Tel Aviv',
      radius: 250
    });

    displayListings(results);

    console.log('\n✅ Test completed successfully!');
    console.log(`📈 Total listings found: ${results.length}`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error?.message || error);
    process.exit(1);
  }
}

if (!process.env.CRAWLBASE_TOKEN) {
  console.error('❌ Error: CRAWLBASE_TOKEN not found');
  process.exit(1);
}

testRadius();
