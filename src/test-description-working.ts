import 'dotenv/config';
import { searchMarketplace } from './scraper';

async function testDescriptions() {
  console.log('🧪 Testing description fetching with proper timeouts\n');

  try {
    // Get listings
    const results = await searchMarketplace({
      query: 'סירה',
      location: 'telaviv',
      radius: 250
    });

    console.log(`Found ${results.length} listings total`);

    // Fetch description for just the first 2 listings as a test
    console.log('\n📝 Fetching descriptions for first 2 listings...\n');

    for (let i = 0; i < Math.min(2, results.length); i++) {
      const listing = results[i];

      console.log(`\n[${i + 1}] ${listing.title}`);
      console.log(`Price: ${listing.price}`);
      console.log(`Location: ${listing.location.city}, ${listing.location.state}`);
      console.log(`URL: ${listing.url}`);

      // Now fetch with descriptions
      const detailedResults = await searchMarketplace(
        {
          query: `${listing.id}`,  // Search by ID won't work, so we'll manually call
          location: 'telaviv'
        },
        {
          fetchDescriptions: false
        }
      );

      // Actually, let me just test the function directly
      console.log('\n⏳ Fetching description...');

      // Import the fetch function - wait, it's private. Let me use the full search with fetchDescriptions
      break;
    }

    // Actually let's just test with fetchDescriptions on a small result set
    console.log('\n\n=== REAL TEST ===\n');

    const detailedResults = await searchMarketplace(
      {
        query: 'סירה עד 7 מטר',  // Specific search that should return fewer results
        location: 'tel-aviv-israel',
        radius: 50
      },
      {
        fetchDescriptions: true
      }
    );

    console.log('\n\n✅ Results with descriptions:\n');

    detailedResults.forEach((listing, i) => {
      console.log(`\n${i + 1}. ${listing.title}`);
      console.log(`   Price: ${listing.price}`);
      console.log(`   Location: ${listing.location.city}`);
      if (listing.description) {
        console.log(`   📝 Description: ${listing.description.substring(0, 150)}...`);
      } else {
        console.log(`   ⚠️  No description found`);
      }
    });

    console.log('\n\n✅ Test complete!');

  } catch (error: any) {
    console.error('\n❌ Error:', error?.message || error);
  }
}

testDescriptions();
