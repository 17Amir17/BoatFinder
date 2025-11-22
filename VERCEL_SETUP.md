# Quick Vercel Setup Guide

## 1. Deploy to Vercel

```bash
vercel
```

Follow the prompts and deploy.

## 2. Add Postgres Database

1. In Vercel dashboard → Storage → Create Database → Postgres
2. Connect it to your project
3. `POSTGRES_URL` will be auto-populated

## 3. Set Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
CRAWLBASE_TOKEN=<your_javascript_token>
ANTHROPIC_API_KEY=<your_anthropic_key>
CRON_SECRET=<random_secret_string>
```

## 4. Test the Cron Endpoint

```bash
curl https://your-project.vercel.app/api/cron/search-boats \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 5. Done!

The cron job will now run every hour automatically.

Check logs in: Vercel Dashboard → Deployments → Functions → search-boats

## What Happens Every Hour

1. Searches for boats in Israel (2 Hebrew search terms)
2. Finds new listings (checks DB for existing IDs)
3. For new listings:
   - Fetches description
   - **LLM analyzes** for: עוצמה א, ≤7m, ≤150HP, parking, price match
   - Saves to database
4. Logs boats in ₪10k-₪100k price range with LLM ratings

See `DEPLOYMENT.md` for full details.
