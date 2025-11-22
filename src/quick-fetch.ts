import 'dotenv/config';
import { CrawlingAPI } from 'crawlbase';

const api = new CrawlingAPI({ token: process.env.CRAWLBASE_TOKEN || '' });

async function quickFetch() {
  const url = 'https://www.facebook.com/marketplace/item/2073304546820270';

  console.log(`Fetching: ${url}\n`);

  try {
    // Try with minimal settings first
    const response = await api.get(url, {
      page_wait: 3000  // Shorter wait
    });

    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`📏 Size: ${(response.body?.length || 0) / 1024} KB\n`);

    if (response.statusCode === 200) {
      const html = response.body?.toString() || '';
      require('fs').writeFileSync('listing_quick.html', html);
      console.log('Saved to: listing_quick.html\n');

      // Decode helper
      const decode = (str: string) => str.replace(/\\u[\dA-Fa-f]{4}/g, m =>
        String.fromCharCode(parseInt(m.replace(/\\u/g, ''), 16))
      );

      // Search for description
      const patterns = [
        { name: 'description', re: /"description":"([^"]{20,})"/},
        { name: 'marketplace_listing_description', re: /"marketplace_listing_description":"([^"]+)"/ },
        { name: 'body text', re: /"body":\{"text":"([^"]+)"\}/ },
        { name: 'og:description', re: /<meta\s+property="og:description"\s+content="([^"]+)"/ }
      ];

      for (const {name, re} of patterns) {
        const m = html.match(re);
        if (m && m[1] && m[1].length > 15) {
          console.log(`✅ Found (${name}):\n`);
          console.log(decode(m[1]));
          console.log('\n');
          return;
        }
      }

      console.log('⚠️  No description found. Check listing_quick.html');
    }
  } catch (error: any) {
    console.error('❌ Error:', error?.message);
    console.error('Full error:', error);
  }
}

quickFetch();
