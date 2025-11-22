import 'dotenv/config';
import { searchMarketplace } from './scraper';
import { displayListings } from './parser';

async function testSearch() {
  console.log('🚀 Testing Facebook Marketplace Search Function\n');

  try {
    // Test 1: Search for boats in Israel
    console.log('================================================================================');
    console.log('TEST 1: Searching for boats in Israel');
    console.log('================================================================================\n');

    const israelResults = await searchMarketplace({
      query: 'boats',
      location: 'Israel'
    });

    displayListings(israelResults);

    // Test 2: Search for boats in Tel Aviv
    console.log('\n\n================================================================================');
    console.log('TEST 2: Searching for boats in Tel Aviv');
    console.log('================================================================================\n');

    const telAvivResults = await searchMarketplace({
      query: 'boats',
      location: 'Tel Aviv'
    });

    displayListings(telAvivResults);

    // Test 3: Search for any item type in a location
    console.log('\n\n================================================================================');
    console.log('TEST 3: Searching for "kayak" in Israel');
    console.log('================================================================================\n');

    const kayakResults = await searchMarketplace({
      query: 'kayak',
      location: 'Israel'
    });

    displayListings(kayakResults);

    console.log('\n\n✅ All tests completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error?.message || error);
    process.exit(1);
  }
}

// Check for API token
if (!process.env.CRAWLBASE_TOKEN) {
  console.error('❌ Error: CRAWLBASE_TOKEN not found in environment variables');
  console.error('📝 Please create a .env file with your Crawlbase API token');
  process.exit(1);
}

testSearch().catch(console.error);
