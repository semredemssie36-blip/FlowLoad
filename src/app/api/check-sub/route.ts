import { NextRequest, NextResponse } from 'next/server';
import { checkUserSubscription } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userIdStr = searchParams.get('userId');

  if (!userIdStr) {
    return NextResponse.json({
      subscribed: true,
      channelUsername: process.env.TELEGRAM_CHANNEL_USERNAME || '@YourChannel',
      channelUrl: `https://t.me/${(process.env.TELEGRAM_CHANNEL_USERNAME || 'YourChannel').replace('@', '')}`,
    });
  }

  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  const status = await checkUserSubscription(userId);
  return NextResponse.json(status);
}
