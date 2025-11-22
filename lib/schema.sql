-- Boat listings table
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price TEXT NOT NULL,
  price_numeric INTEGER, -- Price in shekels as integer for filtering
  strikethrough_price TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  url TEXT NOT NULL,
  delivery_types TEXT, -- JSON array of delivery methods
  is_sold BOOLEAN DEFAULT FALSE,
  is_pending BOOLEAN DEFAULT FALSE,
  category_id TEXT,
  subtitle TEXT,
  description TEXT,
  has_parking BOOLEAN, -- LLM analyzed: does listing mention parking?
  llm_rating INTEGER, -- LLM rating 0-10 of listing quality
  llm_reason TEXT, -- LLM explanation for the rating
  search_query TEXT, -- Which search query found this listing
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_numeric ON listings(price_numeric);
CREATE INDEX IF NOT EXISTS idx_is_sold ON listings(is_sold);

-- Comments
COMMENT ON TABLE listings IS 'Facebook Marketplace boat listings';
COMMENT ON COLUMN listings.price_numeric IS 'Price converted to integer shekels for filtering';
COMMENT ON COLUMN listings.search_query IS 'The search term that discovered this listing';
