# Deploying to Vercel

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Crawlbase JavaScript Token** - From [crawlbase.com](https://crawlbase.com)
3. **Anthropic API Key** - From [console.anthropic.com](https://console.anthropic.com)
4. **Discord Webhook URL** (optional) - For notifications

## Step 1: Create Vercel Postgres Database

1. Go to your Vercel dashboard
2. Navigate to Storage
3. Create a new Postgres database
4. Copy the connection string (will be auto-populated in env vars)

## Step 2: Deploy to Vercel

### Option A: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Option B: Deploy via GitHub

1. Push this repository to GitHub
2. Import the repository in Vercel dashboard
3. Vercel will auto-detect and deploy

## Step 3: Configure Environment Variables

In Vercel dashboard, add these environment variables:

```
CRAWLBASE_TOKEN=your_javascript_token_here
ANTHROPIC_API_KEY=your_anthropic_key_here
CRON_SECRET=generate_random_secret_here
DISCORD_WEBHOOK_URL=your_discord_webhook_url (optional)
```

**The `POSTGRES_URL` is automatically set by Vercel when you connect the database.**

## Step 4: Initialize Database

After first deployment, the database tables will be automatically created on the first cron run.

Alternatively, you can manually run the schema:

```bash
# Connect to your Vercel Postgres database and run:
cat lib/schema.sql | vercel postgres execute
```

## Step 5: Enable Cron Jobs

Cron jobs are automatically enabled based on `vercel.json`.

**Schedule:** Every hour at minute 0 (`0 * * * *`)

**Endpoint:** `/api/cron/search-boats`

## Monitoring

### View Cron Logs

1. Go to your Vercel project dashboard
2. Click on "Deployments"
3. Click on "Functions"
4. Find `/api/cron/search-boats` and view logs

### Manual Trigger (for testing)

```bash
curl -X GET \
  https://your-project.vercel.app/api/cron/search-boats \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How It Works

### Every Hour:

1. **Search** - Runs 2 searches:
   - `סירה` (boats) in Tel Aviv (250km radius)
   - `סירת דייג` (fishing boat) in Tel Aviv (250km radius)

2. **Check DB** - For each result, checks if listing ID exists in database

3. **New Listings Only** - If listing is new:
   - Fetches full description from item page
   - Runs LLM analysis to extract:
     - Boat specs (power category, length, HP)
     - Parking availability
     - Rating (0-10) based on match with criteria
     - Reason for rating
   - Inserts into database

4. **Filter & Notify** - If listing is:
   - In price range (₪10,000 - ₪100,000)
   - Logs to console (Discord webhook ready to enable)

### LLM Analysis Criteria

The LLM evaluates listings based on:
- **Power Category**: עוצמה א (up to 7m, up to 150HP)
- **Length**: Up to 7 meters
- **Engine Power**: Up to 150 HP
- **Parking**: Must mention parking/marina
- **Price**: Ideally around ₪60,000

**Rating Scale:**
- 10 = Perfect match
- 7-9 = Good match
- 4-6 = Partial match
- 0-3 = Poor match

## Cost Estimates

- **Vercel**: Free tier includes cron jobs
- **Vercel Postgres**: Free tier (256 MB storage, 60 hours compute)
- **Crawlbase**: ~$0.01-0.05 per request (JS rendering)
- **Anthropic**: ~$0.003 per analysis (using Sonnet)

**Approximate monthly cost:**
- 24 searches/day × 2 queries = 48 searches/day
- ~10-20 new listings/day (estimate)
- Monthly: ~₪150-300 for Crawlbase + ~₪30-60 for LLM

## Troubleshooting

### Cron not running
- Check Vercel logs for errors
- Verify `CRON_SECRET` is set correctly
- Ensure Postgres database is connected

### API timeouts
- Crawlbase timeouts are set to 2 minutes
- First run will be slow (fetches descriptions for all existing listings)
- Subsequent runs are faster (only new listings)

### Database errors
- Check `POSTGRES_URL` is set
- Verify database connection in Vercel dashboard
- Tables are auto-created on first run

## Future Enhancements

- [ ] Enable Discord webhook notifications
- [ ] Add price range configuration via env vars
- [ ] Add web UI to view listings
- [ ] Add manual search endpoint
- [ ] Add filtering by LLM rating threshold
