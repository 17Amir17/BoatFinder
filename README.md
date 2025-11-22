# BoatFinder - Facebook Marketplace Scraper

A TypeScript scraper for searching Facebook Marketplace using Crawlbase. Fully typed with all available listing details.

## Features

✅ Search any item in any location
✅ Fully typed TypeScript interfaces
✅ Extracts all available listing details
✅ No browser needed (uses Crawlbase API)
✅ Returns structured data arrays

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Get a Crawlbase JavaScript token:**
   - Sign up at [crawlbase.com](https://crawlbase.com/)
   - Get your **JavaScript token** from the dashboard (required for FB Marketplace)

3. **Create a `.env` file:**
```bash
cp .env.example .env
```

4. **Add your Crawlbase token to `.env`:**
```
CRAWLBASE_TOKEN=your_javascript_token_here
```

## Usage

### Basic Example

```typescript
import { searchMarketplace } from './src';

// Search for boats in Tel Aviv within 250km radius
const results = await searchMarketplace({
  query: 'boats',
  location: 'Tel Aviv',
  radius: 250  // Optional: search radius in kilometers
});

console.log(`Found ${results.length} listings`);
```

### Function Signature

```typescript
async function searchMarketplace(
  params: SearchParams,
  options?: SearchOptions
): Promise<MarketplaceListing[]>
```

**Parameters:**
- `params.query` (string) - Search query (e.g., "boats", "kayak", "surfboard")
- `params.location` (string, optional) - Location to search (e.g., "Israel", "Tel Aviv", "Miami")
- `params.radius` (number, optional) - Search radius in kilometers (e.g., 250)
- `options` (SearchOptions, optional) - Crawlbase options (defaults to JS rendering enabled)

**Returns:** Array of `MarketplaceListing` objects

### Data Structure

Each listing returns the following typed data:

```typescript
interface MarketplaceListing {
  id: string;                    // Unique listing ID
  title: string;                 // Listing title
  price: string;                 // Current price (formatted, e.g., "$1,500")
  strikethrough_price?: string;  // Original price if discounted
  location: {
    city: string;                // City name
    state: string;               // State/region
  };
  url: string;                   // Direct marketplace URL
  delivery_types?: string[];     // e.g., ["IN_PERSON", "SHIPPING"]
  is_sold?: boolean;             // Whether item is sold
  is_pending?: boolean;          // Whether sale is pending
  category_id?: string;          // Facebook category ID
  subtitle?: string;             // Additional subtitle if present
}
```

### Complete Example

```typescript
import 'dotenv/config';
import { searchMarketplace, MarketplaceListing } from './src';

async function findBoats() {
  const results: MarketplaceListing[] = await searchMarketplace({
    query: 'boats',
    location: 'Israel',
    radius: 250  // Search within 250km
  });

  // Filter available boats under $5000
  const affordable = results.filter(listing => {
    const price = parseFloat(listing.price.replace(/[^0-9.]/g, ''));
    return !listing.is_sold && price > 0 && price < 5000;
  });

  affordable.forEach(boat => {
    console.log(`
${boat.title} - ${boat.price}
Location: ${boat.location.city}, ${boat.location.state}
${boat.strikethrough_price ? `Original: ${boat.strikethrough_price}` : ''}
URL: ${boat.url}
    `);
  });

  return affordable;
}

findBoats();
```

## Running Tests

```bash
npm test
```

This runs the test suite which searches for boats in Israel and Tel Aviv.

## Running the POC

```bash
npm run dev
```

This runs the original proof-of-concept that tests different search approaches and saves raw HTML responses.

## Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` folder.

## Notes

- **JavaScript Token Required:** Facebook Marketplace is heavily JavaScript-dependent, so you need Crawlbase's JavaScript token (not the normal token)
- **Location Matching:** Facebook's location matching may not be perfect - "Israel" searches might return some listings from nearby regions
- **Rate Limiting:** Be respectful with requests to avoid being blocked. Add delays between searches if making multiple requests
- **Data Availability:** Some fields may be `undefined` if not present in the listing

## Project Structure

```
BoatFinder/
├── src/
│   ├── index.ts       # Main exports
│   ├── scraper.ts     # Search function implementation
│   ├── parser.ts      # HTML parsing logic
│   ├── types.ts       # TypeScript type definitions
│   ├── test.ts        # Test suite
│   └── poc.ts         # Original POC script
├── example.ts         # Usage examples
├── .env.example       # Environment template
└── README.md
```

## License

ISC
