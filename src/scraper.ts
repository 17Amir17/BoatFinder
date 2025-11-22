import 'dotenv/config';
import { CrawlingAPI } from 'crawlbase';
import { MarketplaceListing, SearchParams, SearchOptions } from './types';
import { parseMarketplaceListings } from './parser';

const api = new CrawlingAPI({ token: process.env.CRAWLBASE_TOKEN || '' });

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

    // Save HTML for debugging
    const fs = require('fs');
    const filename = `debug_${location?.replace(/\s+/g, '_') || 'global'}_${query.replace(/\s+/g, '_')}.html`;
    fs.writeFileSync(filename, html);
    console.log(`💾 Saved HTML to: ${filename}`);

    const listings = parseMarketplaceListings(html);

    console.log(`✅ Found ${listings.length} listings`);

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
