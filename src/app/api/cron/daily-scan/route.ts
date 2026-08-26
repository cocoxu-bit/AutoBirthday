import { NextResponse } from 'next/server';
import { executeDailyScan } from '@/lib/scheduler/daily-scan';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await executeDailyScan();

    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      created: result.created,
      errors: result.errors,
      details: result.details,
    });
  } catch (error: any) {
    console.error('Daily scan cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
