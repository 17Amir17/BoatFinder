import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    message: 'BoatFinder API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      cron: '/api/cron/search-boats (requires Bearer token)',
      test: '/api/hello (this endpoint)'
    }
  });
}
