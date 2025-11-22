import 'dotenv/config';
import { CrawlingAPI } from 'crawlbase';
import { MarketplaceListing, SearchParams, SearchOptions } from './types';
import { parseMarketplaceListings } from './parser';

const api = new CrawlingAPI({ token: process.env.CRAWLBASE_TOKEN || '' });

/**
 * Fetch description from an individual listing page
 * @param listingId - The marketplace listing ID
 * @returns The description text or undefined if not found
 */
async function fetchListingDescription(listingId: string): Promise<string | undefined> {
  const url = `https://www.facebook.com/marketplace/item/${listingId}`;

  try {
    const response = await api.get(url, {
      ajax_wait: true,
      page_wait: 15000,  // 15 seconds for page to fully load
      timeout: 120000    // 2 minute timeout for API call
    });

    if (response.statusCode !== 200) {
      console.error(`Failed to fetch listing ${listingId}: HTTP ${response.statusCode}`);
      return undefined;
    }

    const html = response.body?.toString() || '';

    // Try to find description in the HTML
    // Facebook often stores it in a meta tag or in structured data
    const descriptionPatterns = [
      /"marketplace_listing_description":"([^"]+)"/,
      /"body":\{"text":"([^"]+)"\}/,
      /"redacted_description":\{"text":"([^"]+)"\}/
    ];

    for (const pattern of descriptionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // Decode Unicode escape sequences
        return decodeUnicode(match[1]);
      }
    }

    return undefined;
  } catch (error: any) {
    console.error(`Error fetching description for ${listingId}:`, error?.message || error);
    return undefined;
  }
}

/**
 * Decode Unicode escape sequences in strings
 */
function decodeUnicode(str: string): string {
  return str.replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}

/**
 * Search Facebook Marketplace for listings
 * @param params - Search parameters including query, optional location, and optional radius
 * @param options - Optional Crawlbase options (defaults to JS rendering enabled)
 * @returns Array of marketplace listings with all available details
 */
export async function searchMarketplace(
  params: SearchParams,
  options?: SearchOptions
): Promise<MarketplaceListing[]> {
  const { query, location, radius } = params;

  // Build the search URL
  let url: string;
  if (location) {
    // Search in a specific location
    const locationSlug = location.toLowerCase().replace(/\s+/g, '-');
    url = `https://www.facebook.com/marketplace/${locationSlug}/search/?query=${encodeURIComponent(query)}`;

    // Add radius if specified
    if (radius) {
      url += `&radius_in_km=${radius}`;
    }
  } else {
    // Search in all locations (category search)
    url = `https://www.facebook.com/marketplace/category/search/?query=${encodeURIComponent(query)}`;
  }

  // Default options: enable JS rendering with reasonable wait time
  const crawlOptions = {
    ajax_wait: true,
    page_wait: 5000,
    ...options
  };

  try {
    console.log(`🔍 Searching for "${query}" ${location ? `in ${location}` : 'globally'}${radius ? ` (${radius}km radius)` : ''}...`);
    console.log(`📡 URL: ${url}`);

    const response = await api.get(url, crawlOptions);

    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch marketplace: HTTP ${response.statusCode}`);
    }

    const html = response.body?.toString() || '';

    const listings = parseMarketplaceListings(html);

    console.log(`✅ Found ${listings.length} listings`);

    // Fetch descriptions if requested
    if (options?.fetchDescriptions && listings.length > 0) {
      console.log(`📝 Fetching descriptions for ${listings.length} listings...`);

      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        console.log(`   [${i + 1}/${listings.length}] Fetching description for: ${listing.title}`);

        const description = await fetchListingDescription(listing.id);
        listing.description = description;

        // Add a small delay to avoid rate limiting
        if (i < listings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`✅ Descriptions fetched`);
    }

    return listings;
  } catch (error: any) {
    console.error('❌ Error searching marketplace:', error?.message || error);
    throw error;
  }
}

/**
 * Search for boats specifically in a given location
 * @param location - Location to search (e.g., "Israel", "Tel Aviv", "Miami")
 * @returns Array of boat listings
 */
export async function searchBoats(location?: string): Promise<MarketplaceListing[]> {
  return searchMarketplace({ query: 'boats', location });
}
