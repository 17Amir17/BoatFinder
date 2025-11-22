# BoatFinder - Complete System Summary

## ✅ What's Built

A fully automated Facebook Marketplace boat scraper that:
1. Searches for boats in Israel every hour
2. Fetches descriptions for new listings only
3. Uses LLM to analyze if boats match your criteria
4. Stores everything in PostgreSQL
5. Logs notifications for boats in your price range
6. Ready to deploy to Vercel

## 🎯 Your Search Criteria (LLM Evaluated)

The system looks for boats matching:
- **Power Category**: עוצמה א (otzma alef - power A)
- **Length**: Up to 7 meters
- **Engine Power**: Up to 150 HP
- **Parking**: Must mention parking (חניה/מקום עגינה/מרינה)
- **Ideal Price**: Around ₪60,000

**The LLM extracts these specs from Hebrew descriptions and rates each boat 0-10 based on match quality.**

## 📊 Data Collected

Each listing includes:

### From Facebook Marketplace:
- ID, Title, Price, Original Price
- Location (city, state)
- URL, Delivery types
- Sold/Pending status
- Category ID, Subtitle
- **Description** (fetched separately)

### From LLM Analysis:
- **hasParking** (boolean) - Does it mention parking?
- **llm_rating** (0-10) - How well it matches your criteria
- **llm_reason** (string) - Detailed explanation with extracted specs

## 🔄 Hourly Workflow

```
Every hour:
├─ Search 1: "סירה" in Tel Aviv (250km)
├─ Search 2: "סירת דייג" in Tel Aviv (250km)
│
For each result:
├─ Check if listing ID exists in DB
│  ├─ If EXISTS → Skip
│  └─ If NEW →
│     ├─ Fetch description (15 second API call)
│     ├─ Run LLM analysis (extract specs, rate 0-10)
│     ├─ Save to PostgreSQL
│     └─ If price ₪10k-₪100k →
│        └─ Log notification (Discord ready)
```

## 📁 Project Structure

```
BoatFinder/
├── api/
│   └── cron/
│       └── search-boats.ts    # Hourly cron endpoint
├── lib/
│   ├── db.ts                  # Postgres connection & queries
│   ├── filters.ts             # Price filtering logic
│   ├── llm-analysis.ts        # Claude analysis
│   └── schema.sql             # Database schema
├── src/
│   ├── scraper.ts             # Main search function
│   ├── parser.ts              # HTML parsing
│   ├── types.ts               # TypeScript interfaces
│   └── index.ts               # Exports
├── vercel.json                # Cron configuration (hourly)
├── DEPLOYMENT.md              # Full deployment guide
└── VERCEL_SETUP.md            # Quick setup guide
```

## 🗄️ Database Schema

```sql
CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price TEXT NOT NULL,
  price_numeric INTEGER,
  strikethrough_price TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  url TEXT NOT NULL,
  delivery_types TEXT,
  is_sold BOOLEAN,
  is_pending BOOLEAN,
  category_id TEXT,
  subtitle TEXT,
  description TEXT,
  has_parking BOOLEAN,       -- LLM extracted
  llm_rating INTEGER,        -- LLM rating 0-10
  llm_reason TEXT,           -- LLM explanation
  search_query TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🚀 Deployment Checklist

- [ ] Deploy to Vercel (`vercel`)
- [ ] Create Postgres database in Vercel
- [ ] Set environment variables:
  - `CRAWLBASE_TOKEN` (JavaScript token)
  - `ANTHROPIC_API_KEY`
  - `CRON_SECRET` (random string)
  - `POSTGRES_URL` (auto-set by Vercel)
- [ ] Test cron endpoint manually
- [ ] Wait for hourly cron to run
- [ ] Check logs in Vercel dashboard

## 💰 Cost Estimate

**Per month (~720 searches, ~300 new listings):**
- Vercel: Free
- Vercel Postgres: Free (within limits)
- Crawlbase: ~₪200-400 (depends on usage)
- Anthropic API: ~₪50-100 (Claude Haiku)

**Total: ~₪250-500/month**

## 🔮 Future Features (Ready to Implement)

- Discord webhook (code ready, just uncomment)
- Web UI to browse listings
- Price range configuration via env vars
- Manual search API endpoint
- Filtering by LLM rating threshold (only notify 8+/10)

## 🧪 Testing Locally

Test the LLM analysis:
```bash
npx tsx src/test-llm-analysis.ts
```

Test the full scraper:
```bash
npx tsx example.ts
```

## 📈 Monitoring

View cron logs: Vercel Dashboard → Functions → search-boats

Manual trigger:
```bash
curl https://your-app.vercel.app/api/cron/search-boats \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
