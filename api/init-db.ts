import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeDatabase } from '../lib/db';

/**
 * Initialize database tables
 * Run this once after deploying to create the schema
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Optional: Add auth if you want
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  console.log('🗄️ Initializing database...');

  try {
    await initializeDatabase();

    console.log('✅ Database initialized successfully!');

    return res.status(200).json({
      success: true,
      message: 'Database tables created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error initializing database:', error);

    return res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error',
      details: error?.stack,
      timestamp: new Date().toISOString()
    });
  }
}
