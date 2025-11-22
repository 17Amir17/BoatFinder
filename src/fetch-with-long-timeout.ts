import 'dotenv/config';
import { CrawlingAPI } from 'crawlbase';

const api = new CrawlingAPI({ token: process.env.CRAWLBASE_TOKEN || '' });

async function fetchWithLongTimeout() {
  const url = 'https://www.facebook.com/marketplace/item/2073304546820270';

  console.log(`🔍 Fetching: ${url}`);
  console.log('⏰ Using extended timeouts...\n');

  try {
    // Extended timeouts
    const response = await api.get(url, {
      ajax_wait: true,
      page_wait: 15000,  // 15 seconds page wait
      timeout: 120000    // 2 minute timeout
    });

    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`📏 Size: ${(response.body?.length || 0) / 1024} KB\n`);

    if (response.statusCode !== 200) {
      console.error('❌ Failed to fetch');
      return;
    }

    const html = response.body?.toString() || '';

    // Save it
    require('fs').writeFileSync('listing_long_timeout.html', html);
    console.log('💾 Saved to: listing_long_timeout.html\n');

    // Decode unicode
    const decode = (str: string) => str.replace(/\\u[\dA-Fa-f]{4}/g, m =>
      String.fromCharCode(parseInt(m.replace(/\\u/g, ''), 16))
    );

    // Search for the specific text the user mentioned
    const targetText = 'סירה מדגם  OTHELOS';
    if (html.includes(targetText)) {
      console.log('✅ Found target text in HTML!\n');
      const idx = html.indexOf(targetText);
      console.log('Context:', html.substring(idx, idx + 200));
    }

    // Try multiple patterns
    const patterns = [
      { name: 'marketplace_listing_description', re: /"marketplace_listing_description":"([^"]{50,})"/},
      { name: 'body text', re: /"body":\{"text":"([^"]{50,})"\}/ },
      { name: 'redacted_description text', re: /"redacted_description":\{"text":"([^"]{50,})"\}/ },
      { name: 'description field', re: /"description":"([^"]{50,})"/ },
      { name: 'listing description', re: /"listing_description":"([^"]{50,})"/ },
      { name: 'og:description', re: /<meta\s+property="og:description"\s+content="([^"]+)"/ }
    ];

    console.log('\n🔍 Searching patterns...\n');

    for (const {name, re} of patterns) {
      const m = html.match(re);
      if (m && m[1] && m[1].length > 30) {
        console.log(`✅ FOUND with "${name}":`);
        const decoded = decode(m[1]);
        console.log(decoded.substring(0, 300));
        console.log('\n');
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error?.message);
  }
}

fetchWithLongTimeout();
