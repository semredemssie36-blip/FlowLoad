import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, firstName, username, referrerId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Telegram user ID is required' }, { status: 400 });
    }

    const userId = BigInt(id);
    const refId = referrerId ? BigInt(referrerId) : null;

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { referrals: true, downloadLogs: true },
        },
      },
    });

    if (!user) {
      // Validate referrer exists if provided
      let validReferrerId: bigint | null = null;
      if (refId && refId !== userId) {
        const referrerExists = await db.user.findUnique({ where: { id: refId } });
        if (referrerExists) {
          validReferrerId = refId;
          // Reward referrer with bonus points
          await db.user.update({
            where: { id: refId },
            data: { points: { increment: 250 } },
          });
        }
      }

      // Create new user
      user = await db.user.create({
        data: {
          id: userId,
          firstName: firstName || 'Explorer',
          username: username || null,
          points: 100, // Welcome points
          referrerId: validReferrerId,
        },
        include: {
          _count: {
            select: { referrals: true, downloadLogs: true },
          },
        },
      });
    } else {
      // Update last active
      user = await db.user.update({
        where: { id: userId },
        data: {
          lastActive: new Date(),
          firstName: firstName || user.firstName,
          username: username || user.username,
        },
        include: {
          _count: {
            select: { referrals: true, downloadLogs: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        firstName: user.firstName,
        username: user.username,
        points: user.points,
        streakDays: user.streakDays,
        downloadsCount: user._count.downloadLogs,
        referralsCount: user._count.referrals,
      },
    });
  } catch (error: unknown) {
    console.error('User sync error:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync user';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
