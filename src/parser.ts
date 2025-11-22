import { MarketplaceListing } from './types';

/**
 * Decode Unicode escape sequences in strings (e.g., \u05d0 -> א)
 */
function decodeUnicode(str: string): string {
  return str.replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}

export function parseMarketplaceListings(html: string): MarketplaceListing[] {
  const listings: MarketplaceListing[] = [];

  try {
    // Find all GroupCommerceProductItem listings
    const listingPattern = /"GroupCommerceProductItem","id":"(\d+)"/g;
    const titlePattern = /"marketplace_listing_title":"([^"]+)"/g;
    const pricePattern = /"listing_price":\{"formatted_amount":"([^"]+)"/g;
    const strikethroughPattern = /"strikethrough_price":\{"formatted_amount":"([^"]+)"/g;
    const locationPattern = /"reverse_geocode":\{"city":"([^"]+)","state":"([^"]+)"/g;
    const deliveryPattern = /"delivery_types":\[([^\]]+)\]/g;
    const soldPattern = /"is_sold":(true|false)/g;
    const pendingPattern = /"is_pending":(true|false)/g;
    const categoryPattern = /"marketplace_listing_category_id":"([^"]+)"/g;
    const subtitlePattern = /"subtitle":"([^"]+)"/g;

    // Extract all IDs
    const ids: string[] = [];
    let match;
    while ((match = listingPattern.exec(html)) !== null) {
      ids.push(match[1]);
    }

    // Extract all titles
    const titles: string[] = [];
    while ((match = titlePattern.exec(html)) !== null) {
      titles.push(match[1]);
    }

    // Extract all prices
    const prices: string[] = [];
    while ((match = pricePattern.exec(html)) !== null) {
      prices.push(match[1]);
    }

    // Extract strikethrough prices
    const strikethroughPrices: (string | null)[] = [];
    while ((match = strikethroughPattern.exec(html)) !== null) {
      strikethroughPrices.push(match[1]);
    }

    // Extract all locations
    const locations: Array<{ city: string; state: string }> = [];
    while ((match = locationPattern.exec(html)) !== null) {
      locations.push({ city: match[1], state: match[2] });
    }

    // Extract delivery types
    const deliveryTypes: (string[] | null)[] = [];
    while ((match = deliveryPattern.exec(html)) !== null) {
      const types = match[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || [];
      deliveryTypes.push(types.length > 0 ? types : null);
    }

    // Extract sold status
    const soldStatuses: boolean[] = [];
    while ((match = soldPattern.exec(html)) !== null) {
      soldStatuses.push(match[1] === 'true');
    }

    // Extract pending status
    const pendingStatuses: boolean[] = [];
    while ((match = pendingPattern.exec(html)) !== null) {
      pendingStatuses.push(match[1] === 'true');
    }

    // Extract categories
    const categories: string[] = [];
    while ((match = categoryPattern.exec(html)) !== null) {
      categories.push(match[1]);
    }

    // Extract subtitles
    const subtitles: string[] = [];
    while ((match = subtitlePattern.exec(html)) !== null) {
      if (match[1] && match[1].trim()) {
        subtitles.push(match[1]);
      }
    }

    // Match them up (assuming they appear in the same order)
    const minLength = Math.min(ids.length, titles.length, prices.length, locations.length);

    for (let i = 0; i < minLength; i++) {
      listings.push({
        id: ids[i],
        title: decodeUnicode(titles[i]),
        price: decodeUnicode(prices[i]),
        strikethrough_price: strikethroughPrices[i] ? decodeUnicode(strikethroughPrices[i]) : undefined,
        location: {
          city: decodeUnicode(locations[i].city),
          state: decodeUnicode(locations[i].state)
        },
        url: `https://www.facebook.com/marketplace/item/${ids[i]}`,
        delivery_types: deliveryTypes[i] || undefined,
        is_sold: soldStatuses[i] !== undefined ? soldStatuses[i] : undefined,
        is_pending: pendingStatuses[i] !== undefined ? pendingStatuses[i] : undefined,
        category_id: categories[i] || undefined,
        subtitle: subtitles[i] ? decodeUnicode(subtitles[i]) : undefined
      });
    }

  } catch (e) {
    console.error('Error parsing listings:', e);
  }

  // Remove duplicates based on ID
  const uniqueListings = Array.from(
    new Map(listings.map(item => [item.id, item])).values()
  );

  return uniqueListings;
}

export function displayListings(listings: MarketplaceListing[]) {
  console.log(`\n🚤 Found ${listings.length} boat listings:\n`);
  console.log('='.repeat(100));

  listings.forEach((listing, index) => {
    console.log(`\n${index + 1}. ${listing.title}`);
    console.log(`   💰 Price: ${listing.price}`);

    if (listing.strikethrough_price) {
      console.log(`   🏷️  Original Price: ${listing.strikethrough_price} (discounted!)`);
    }

    console.log(`   📍 Location: ${listing.location.city}, ${listing.location.state}`);

    if (listing.subtitle) {
      console.log(`   📝 Subtitle: ${listing.subtitle}`);
    }

    if (listing.delivery_types && listing.delivery_types.length > 0) {
      console.log(`   🚚 Delivery: ${listing.delivery_types.join(', ')}`);
    }

    if (listing.is_sold !== undefined) {
      console.log(`   ${listing.is_sold ? '❌ SOLD' : '✅ Available'}`);
    }

    if (listing.is_pending !== undefined && listing.is_pending) {
      console.log(`   ⏳ PENDING`);
    }

    if (listing.category_id) {
      console.log(`   🏷️  Category ID: ${listing.category_id}`);
    }

    console.log(`   🔗 URL: ${listing.url}`);
    console.log(`   🆔 ID: ${listing.id}`);
  });

  console.log('\n' + '='.repeat(100));
}
