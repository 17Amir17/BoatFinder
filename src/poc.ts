import 'dotenv/config';
import { CrawlingAPI } from 'crawlbase';
import { parseMarketplaceListings, displayListings } from './parser';

// Initialize Crawlbase API
const api = new CrawlingAPI({ token: process.env.CRAWLBASE_TOKEN || '' });

async function testFacebookMarketplace() {
  console.log('🚀 Starting Facebook Marketplace POC with Crawlbase\n');

  // Test URLs - searching for boats in Israel
  const testCases = [
    {
      name: 'Marketplace Search - Boats in Tel Aviv',
      url: 'https://www.facebook.com/marketplace/tel-aviv-israel/search/?query=boat',
      options: { ajax_wait: true, page_wait: 5000 }
    },
    {
      name: 'Marketplace Search - Boats category',
      url: 'https://www.facebook.com/marketplace/category/boats?deliveryMethod=local_pick_up&exact=false',
      options: { ajax_wait: true, page_wait: 5000 }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`🔗 URL: ${testCase.url}`);
    console.log(`⚙️  Options: ${JSON.stringify(testCase.options)}`);
    console.log('='.repeat(80));

    try {
      const response = await api.get(testCase.url, testCase.options);

      console.log('\n✅ Response received!');
      console.log(`📊 Status Code: ${response.statusCode}`);
      console.log(`📏 Body Length: ${response.body?.length || 0} characters`);
      console.log(`💾 Original Status: ${response.originalStatus}`);

      // Check if we got HTML content
      const bodyStr = response.body?.toString() || '';
      console.log(`🔍 Contains HTML: ${bodyStr.includes('<html')}`);
      console.log(`🔍 Contains "marketplace": ${bodyStr.includes('marketplace')}`);
      console.log(`🔍 Contains "boat": ${bodyStr.toLowerCase().includes('boat')}`);

      // Look for common Facebook elements
      console.log(`🔍 Contains Facebook meta: ${bodyStr.includes('facebook.com')}`);
      console.log(`🔍 Contains React: ${bodyStr.includes('react')}`);

      // Save the response for inspection
      const fs = require('fs');
      const filename = `response_${testCase.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
      fs.writeFileSync(filename, bodyStr);
      console.log(`💾 Response saved to: ${filename}`);

      // Try to find listing patterns
      const priceMatches = bodyStr.match(/\$[\d,]+/g);
      if (priceMatches) {
        console.log(`💰 Found ${priceMatches.length} potential prices: ${priceMatches.slice(0, 5).join(', ')}...`);
      }

      // Parse and display listings
      const listings = parseMarketplaceListings(bodyStr);
      displayListings(listings);

    } catch (error: any) {
      console.error(`\n❌ Error occurred:`);
      console.error(`Message: ${error?.message || 'Unknown error'}`);
      console.error(`Error object:`, error);
      if (error.response) {
        console.error(`Response Status: ${error.response.status}`);
        console.error(`Response Data: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
      }
    }

    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('🏁 POC Complete!');
  console.log('='.repeat(80));
  console.log('\n📝 Next Steps:');
  console.log('1. Check the saved HTML files to see what data is available');
  console.log('2. Look for JSON data embedded in the HTML (often in <script> tags)');
  console.log('3. Identify patterns for extracting listing information');
  console.log('4. Check if we need authentication or additional headers');
}

// Run the POC
if (!process.env.CRAWLBASE_TOKEN) {
  console.error('❌ Error: CRAWLBASE_TOKEN not found in environment variables');
  console.error('📝 Please create a .env file with your Crawlbase API token');
  console.error('   Copy .env.example to .env and add your token');
  process.exit(1);
}

testFacebookMarketplace().catch(console.error);
