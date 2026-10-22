import { NextResponse } from 'next/server';
import { runAutoDeleteSweep } from '@/lib/movies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const deletedCount = await runAutoDeleteSweep();
    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Sweep failed';
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
