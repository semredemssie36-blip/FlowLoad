import { NextRequest, NextResponse } from 'next/server';
import { extractMedia } from '@/lib/extractors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid media URL is required' },
        { status: 400 }
      );
    }

    const result = await extractMedia(url);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to extract media' },
        { status: 422 }
      );
    }

    // Optional background log in PostgreSQL if userId is provided
    const userId = body.userId;
    if (userId && result.data) {
      try {
        const { db } = await import('@/lib/db');
        const parsedUserId = BigInt(userId);
        
        // Ensure user exists before logging
        await db.user.upsert({
          where: { id: parsedUserId },
          create: { id: parsedUserId, firstName: 'User', points: 100 },
          update: { lastActive: new Date() },
        });

        await db.downloadLog.create({
          data: {
            userId: parsedUserId,
            platform: result.data.platform,
            url: url,
          },
        });
      } catch (logErr) {
        console.warn('Could not log download to database:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
