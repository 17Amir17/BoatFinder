import 'dotenv/config';
import { CrawlingAPI } from 'crawlbase';

const api = new CrawlingAPI({ token: process.env.CRAWLBASE_TOKEN || '' });

async function fetchOne() {
  const url = 'https://www.facebook.com/marketplace/item/2073304546820270';

  console.log(`Fetching: ${url}\n`);

  try {
    const response = await api.get(url, {
      ajax_wait: true,
      page_wait: 8000  // Longer wait
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(`Response size: ${response.body?.length || 0} bytes\n`);

    if (response.statusCode !== 200) {
      console.error('Failed to fetch');
      return;
    }

    const html = response.body?.toString() || '';

    // Save it
    require('fs').writeFileSync('listing_2073304546820270.html', html);
    console.log('✅ Saved to: listing_2073304546820270.html\n');

    // Decode unicode
    function decode(str: string): string {
      return str.replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
      });
    }

    // Try to find description
    const patterns = [
      /"marketplace_listing_description":"([^"]+)"/,
      /"body":\{"text":"([^"]+)"\}/,
      /"redacted_description":\{"text":"([^"]+)"\}/,
      /<meta\s+property="og:description"\s+content="([^"]+)"/,
      /"description":"([^"]+)"/,
      /"listing_description":"([^"]+)"/
    ];

    console.log('Searching for description...\n');

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 10) {
        console.log(`✅ FOUND:\n${decode(match[1])}\n`);
        break;
      }
    }
  } catch (error: any) {
    console.error('Error:', error?.message || error);
  }
}

fetchOne();
