import 'dotenv/config';
import { CrawlingAPI } from 'crawlbase';

const api = new CrawlingAPI({ token: process.env.CRAWLBASE_TOKEN || '' });

async function testSpecificListing() {
  const listingId = '2073304546820270';
  const url = `https://www.facebook.com/marketplace/item/${listingId}`;

  console.log(`🔍 Fetching listing: ${listingId}`);
  console.log(`📡 URL: ${url}\n`);

  try {
    const response = await api.get(url, { ajax_wait: true, page_wait: 5000 });

    if (response.statusCode !== 200) {
      console.error(`❌ Failed: HTTP ${response.statusCode}`);
      return;
    }

    const html = response.body?.toString() || '';

    // Save the HTML
    const fs = require('fs');
    const filename = `listing_${listingId}.html`;
    fs.writeFileSync(filename, html);
    console.log(`✅ Saved HTML to: ${filename}`);
    console.log(`📏 File size: ${(html.length / 1024).toFixed(2)} KB\n`);

    // Try different patterns to find description
    console.log('🔍 Searching for description patterns...\n');

    const patterns = [
      { name: 'marketplace_listing_description', pattern: /"marketplace_listing_description":"([^"]+)"/ },
      { name: 'body text', pattern: /"body":\{"text":"([^"]+)"\}/ },
      { name: 'redacted_description', pattern: /"redacted_description":\{"text":"([^"]+)"\}/ },
      { name: 'meta description', pattern: /<meta\s+property="og:description"\s+content="([^"]+)"/ },
      { name: 'item description', pattern: /"description":"([^"]+)"/ }
    ];

    let found = false;
    for (const { name, pattern } of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        console.log(`✅ Found with pattern "${name}":`);
        console.log(`   ${match[1].substring(0, 200)}${match[1].length > 200 ? '...' : ''}\n`);
        found = true;
      }
    }

    if (!found) {
      console.log('❌ No description found with any pattern');
      console.log('\n💡 Check the HTML file to find the description manually');
    }

  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
  }
}

testSpecificListing();
