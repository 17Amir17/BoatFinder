import 'dotenv/config';
import { searchMarketplace } from './scraper';

async function testSingleDescription() {
  console.log('🧪 Testing single listing description fetch\n');

  try {
    // First get a listing
    console.log('Step 1: Getting listings...');
    const results = await searchMarketplace({
      query: 'סירה',
      location: 'telaviv',
      radius: 250
    });

    if (results.length === 0) {
      console.log('No listings found');
      return;
    }

    console.log(`Found ${results.length} listings`);
    console.log(`\nStep 2: Fetching description for first listing: ${results[0].title}`);
    console.log(`ID: ${results[0].id}`);

    // Now fetch with descriptions enabled (just first one)
    const detailedResults = await searchMarketplace(
      {
        query: 'סירה',
        location: 'telaviv',
        radius: 250
      },
      {
        fetchDescriptions: true
      }
    );

    console.log('\n✅ Test complete!');
    if (detailedResults[0].description) {
      console.log(`\nDescription found: ${detailedResults[0].description}`);
    } else {
      console.log('\n⚠️ No description found - check the saved listing HTML file');
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error?.message || error);
  }
}

testSingleDescription();
