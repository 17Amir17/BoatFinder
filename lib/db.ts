import { PrismaClient } from '@prisma/client';
import { MarketplaceListing } from '../src/types';

const prisma = new PrismaClient();

export interface DBListing extends MarketplaceListing {
  search_query?: string;
  price_numeric?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Check if a listing already exists in the database
 */
export async function listingExists(id: string): Promise<boolean> {
  const listing = await prisma.listing.findUnique({
    where: { id }
  });
  return listing !== null;
}

/**
 * Check which listings exist in the database (batch operation)
 * Returns a Set of listing IDs that already exist
 */
export async function getExistingListingIds(ids: string[]): Promise<Set<string>> {
  const listings = await prisma.listing.findMany({
    where: {
      id: { in: ids }
    },
    select: { id: true }
  });

  return new Set(listings.map(l => l.id));
}

/**
 * Insert a new listing into the database
 */
export async function insertListing(
  listing: MarketplaceListing,
  searchQuery: string
): Promise<void> {
  const priceNumeric = parsePrice(listing.price);

  await prisma.listing.upsert({
    where: { id: listing.id },
    update: {
      updatedAt: new Date(),
      isSold: listing.is_sold || false,
      isPending: listing.is_pending || false,
      description: listing.description || undefined,
      hasParking: listing.hasParking || undefined,
      llmRating: listing.llm_rating || undefined,
      llmReason: listing.llm_reason || undefined
    },
    create: {
      id: listing.id,
      title: listing.title,
      price: listing.price,
      priceNumeric,
      strikethroughPrice: listing.strikethrough_price,
      city: listing.location.city,
      state: listing.location.state,
      url: listing.url,
      deliveryTypes: listing.delivery_types ? JSON.stringify(listing.delivery_types) : undefined,
      isSold: listing.is_sold || false,
      isPending: listing.is_pending || false,
      categoryId: listing.category_id,
      subtitle: listing.subtitle,
      description: listing.description,
      hasParking: listing.hasParking,
      llmRating: listing.llm_rating,
      llmReason: listing.llm_reason,
      searchQuery
    }
  });
}

/**
 * Get all listings from the database
 */
export async function getAllListings(): Promise<DBListing[]> {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return listings.map(row => ({
    id: row.id,
    title: row.title,
    price: row.price,
    strikethrough_price: row.strikethroughPrice || undefined,
    location: {
      city: row.city,
      state: row.state
    },
    url: row.url,
    delivery_types: row.deliveryTypes ? JSON.parse(row.deliveryTypes) : undefined,
    is_sold: row.isSold,
    is_pending: row.isPending,
    category_id: row.categoryId || undefined,
    subtitle: row.subtitle || undefined,
    description: row.description || undefined,
    hasParking: row.hasParking || undefined,
    llm_rating: row.llmRating || undefined,
    llm_reason: row.llmReason || undefined,
    search_query: row.searchQuery || undefined,
    price_numeric: row.priceNumeric || undefined,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  }));
}

/**
 * Get listings by price range
 */
export async function getListingsByPriceRange(
  minPrice: number,
  maxPrice: number
): Promise<DBListing[]> {
  const listings = await prisma.listing.findMany({
    where: {
      priceNumeric: {
        gte: minPrice,
        lte: maxPrice
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return listings.map(row => ({
    id: row.id,
    title: row.title,
    price: row.price,
    strikethrough_price: row.strikethroughPrice || undefined,
    location: {
      city: row.city,
      state: row.state
    },
    url: row.url,
    delivery_types: row.deliveryTypes ? JSON.parse(row.deliveryTypes) : undefined,
    is_sold: row.isSold,
    is_pending: row.isPending,
    category_id: row.categoryId || undefined,
    subtitle: row.subtitle || undefined,
    description: row.description || undefined,
    hasParking: row.hasParking || undefined,
    llm_rating: row.llmRating || undefined,
    llm_reason: row.llmReason || undefined,
    search_query: row.searchQuery || undefined,
    price_numeric: row.priceNumeric || undefined,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  }));
}

/**
 * Parse price string to number (handles ₪, $, commas, etc.)
 */
function parsePrice(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[₪$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.floor(num);
}

/**
 * Initialize database (create tables if they don't exist)
 */
export async function initializeDatabase(): Promise<void> {
  // With Prisma, tables are created via migration
  // This function is now a no-op, but kept for compatibility
  console.log('Database schema is managed by Prisma migrations');
}
