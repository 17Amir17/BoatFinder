import { createClient } from '@vercel/postgres';
import { MarketplaceListing } from '../src/types';

const client = createClient({
  connectionString: process.env.POSTGRES_URL
});

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
  const result = await client.sql`
    SELECT id FROM listings WHERE id = ${id} LIMIT 1
  `;
  return (result.rowCount || 0) > 0;
}

/**
 * Insert a new listing into the database
 */
export async function insertListing(
  listing: MarketplaceListing,
  searchQuery: string
): Promise<void> {
  await client.connect();
  const priceNumeric = parsePrice(listing.price);

  await client.sql`
    INSERT INTO listings (
      id, title, price, price_numeric, strikethrough_price,
      city, state, url, delivery_types,
      is_sold, is_pending, category_id, subtitle, description,
      has_parking, llm_rating, llm_reason,
      search_query, created_at, updated_at
    ) VALUES (
      ${listing.id},
      ${listing.title},
      ${listing.price},
      ${priceNumeric},
      ${listing.strikethrough_price || null},
      ${listing.location.city},
      ${listing.location.state},
      ${listing.url},
      ${listing.delivery_types ? JSON.stringify(listing.delivery_types) : null},
      ${listing.is_sold || false},
      ${listing.is_pending || false},
      ${listing.category_id || null},
      ${listing.subtitle || null},
      ${listing.description || null},
      ${listing.hasParking || null},
      ${listing.llm_rating || null},
      ${listing.llm_reason || null},
      ${searchQuery},
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      updated_at = NOW(),
      is_sold = EXCLUDED.is_sold,
      is_pending = EXCLUDED.is_pending,
      description = COALESCE(EXCLUDED.description, listings.description),
      has_parking = COALESCE(EXCLUDED.has_parking, listings.has_parking),
      llm_rating = COALESCE(EXCLUDED.llm_rating, listings.llm_rating),
      llm_reason = COALESCE(EXCLUDED.llm_reason, listings.llm_reason)
  `;
}

/**
 * Get all listings from the database
 */
export async function getAllListings(): Promise<DBListing[]> {
  const result = await client.sql`
    SELECT * FROM listings ORDER BY created_at DESC
  `;

  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    price: row.price,
    strikethrough_price: row.strikethrough_price,
    location: {
      city: row.city,
      state: row.state
    },
    url: row.url,
    delivery_types: row.delivery_types ? JSON.parse(row.delivery_types) : undefined,
    is_sold: row.is_sold,
    is_pending: row.is_pending,
    category_id: row.category_id,
    subtitle: row.subtitle,
    description: row.description,
    hasParking: row.has_parking,
    llm_rating: row.llm_rating,
    llm_reason: row.llm_reason,
    search_query: row.search_query,
    price_numeric: row.price_numeric,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

/**
 * Get listings by price range
 */
export async function getListingsByPriceRange(
  minPrice: number,
  maxPrice: number
): Promise<DBListing[]> {
  const result = await client.sql`
    SELECT * FROM listings
    WHERE price_numeric >= ${minPrice}
      AND price_numeric <= ${maxPrice}
    ORDER BY created_at DESC
  `;

  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    price: row.price,
    strikethrough_price: row.strikethrough_price,
    location: {
      city: row.city,
      state: row.state
    },
    url: row.url,
    delivery_types: row.delivery_types ? JSON.parse(row.delivery_types) : undefined,
    is_sold: row.is_sold,
    is_pending: row.is_pending,
    category_id: row.category_id,
    subtitle: row.subtitle,
    description: row.description,
    hasParking: row.has_parking,
    llm_rating: row.llm_rating,
    llm_reason: row.llm_reason,
    search_query: row.search_query,
    price_numeric: row.price_numeric,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

/**
 * Parse price string to number (handles ₪, $, commas, etc.)
 */
function parsePrice(priceStr: string): number | null {
  // Remove currency symbols and commas
  const cleaned = priceStr.replace(/[₪$,]/g, '').trim();

  // Parse to number
  const num = parseFloat(cleaned);

  // Return null if invalid
  return isNaN(num) ? null : Math.floor(num);
}

/**
 * Initialize database (create tables if they don't exist)
 */
export async function initializeDatabase(): Promise<void> {
  await client.sql`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price TEXT NOT NULL,
      price_numeric INTEGER,
      strikethrough_price TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      url TEXT NOT NULL,
      delivery_types TEXT,
      is_sold BOOLEAN DEFAULT FALSE,
      is_pending BOOLEAN DEFAULT FALSE,
      category_id TEXT,
      subtitle TEXT,
      description TEXT,
      has_parking BOOLEAN,
      llm_rating INTEGER,
      llm_reason TEXT,
      search_query TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await client.sql`
    CREATE INDEX IF NOT EXISTS idx_created_at ON listings(created_at DESC)
  `;

  await client.sql`
    CREATE INDEX IF NOT EXISTS idx_price_numeric ON listings(price_numeric)
  `;

  await client.sql`
    CREATE INDEX IF NOT EXISTS idx_is_sold ON listings(is_sold)
  `;
}
