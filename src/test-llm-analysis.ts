import 'dotenv/config';
import { analyzeListingWithLLM } from '../lib/llm-analysis';
import { MarketplaceListing } from './types';

async function testLLMAnalysis() {
  console.log('🧪 Testing LLM Analysis\n');

  // Test with a realistic boat listing (the one from earlier)
  const testListing: MarketplaceListing = {
    id: '2073304546820270',
    title: 'סירה עד 7 מטר',
    price: '₪100,000',
    location: { city: 'תל אביב - יפו', state: 'TA' },
    url: 'https://www.facebook.com/marketplace/item/2073304546820270',
    description: 'סירה מדגם OTHELOS-20ספורט שנת 2018 במצב חדש כולל כושר שייט עד 06/2027 כולל ציוד פירוטכניקה,פיש פיינדר וGPS גרמין חדש, כולל כיסוי מלא, מנוע חיצוני ימאהה 115 עשה 105 שעות בלבד עבר את כל הטיפולים הנדרשים, כולל מקום עגינה מרינה אשדוד משולם עד 07/2026'
  };

  console.log('📋 Test Listing:');
  console.log(`   Title: ${testListing.title}`);
  console.log(`   Price: ${testListing.price}`);
  console.log(`   Description: ${testListing.description}\n`);

  console.log('🤖 Analyzing with LLM...\n');

  try {
    const analysis = await analyzeListingWithLLM(testListing);

    console.log('✅ LLM Analysis Results:\n');
    console.log(`   Has Parking: ${analysis.hasParking ? 'YES' : 'NO'}`);
    console.log(`   Rating: ${analysis.rating}/10`);
    console.log(`   Reason: ${analysis.reason}\n`);

    // Test another listing without description
    console.log('\n' + '='.repeat(80));
    console.log('\n🧪 Testing with listing without description\n');

    const noDescListing: MarketplaceListing = {
      id: 'test123',
      title: 'סירת דייג',
      price: '₪45,000',
      location: { city: 'חיפה', state: 'HA' },
      url: 'https://www.facebook.com/marketplace/item/test123'
    };

    const analysis2 = await analyzeListingWithLLM(noDescListing);

    console.log('✅ LLM Analysis Results (no description):\n');
    console.log(`   Has Parking: ${analysis2.hasParking ? 'YES' : 'NO'}`);
    console.log(`   Rating: ${analysis2.rating}/10`);
    console.log(`   Reason: ${analysis2.reason}\n`);

    console.log('\n✅ All tests completed!');

  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY not found in environment');
  console.error('   Add your Anthropic API key to .env file');
  process.exit(1);
}

testLLMAnalysis();
