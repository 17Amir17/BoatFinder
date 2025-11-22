import { MarketplaceListing } from '../src/types';

/**
 * Parse price string to number (handles ₪, $, commas, etc.)
 */
export function parsePrice(priceStr: string): number | null {
  // Remove currency symbols and commas
  const cleaned = priceStr.replace(/[₪$,]/g, '').trim();

  // Parse to number
  const num = parseFloat(cleaned);

  // Return null if invalid
  return isNaN(num) ? null : Math.floor(num);
}

/**
 * Check if a listing's price is within the specified range
 */
export function isInPriceRange(
  listing: MarketplaceListing,
  minPrice: number,
  maxPrice: number
): boolean {
  const price = parsePrice(listing.price);

  if (price === null) {
    return false; // Skip listings with invalid/missing prices
  }

  return price >= minPrice && price <= maxPrice;
}

/**
 * Filter listings by price range
 */
export function filterByPriceRange(
  listings: MarketplaceListing[],
  minPrice: number,
  maxPrice: number
): MarketplaceListing[] {
  return listings.filter(listing => isInPriceRange(listing, minPrice, maxPrice));
}

/**
 * Default price range for notifications (₪10,000 - ₪100,000)
 */
export const DEFAULT_PRICE_RANGE = {
  min: 10000,
  max: 100000
};

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `₪${price.toLocaleString()}`;
}
