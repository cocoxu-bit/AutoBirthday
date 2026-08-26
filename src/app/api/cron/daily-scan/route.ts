import { NextResponse } from 'next/server';
import { executeDailyScan } from '@/lib/scheduler/daily-scan';

async function handleRequest(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get('secret');

    const expectedSecret = process.env.CRON_SECRET;
    const isAuthorized = !expectedSecret || 
      authHeader === `Bearer ${expectedSecret}` || 
      querySecret === expectedSecret;

    if (!isAuthorized) {
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

export async function GET(req: Request) {
  return handleRequest(req);
}

export async function POST(req: Request) {
  return handleRequest(req);
}
