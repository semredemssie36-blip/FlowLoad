import { NextRequest, NextResponse } from 'next/server';
import { bot, checkUserSubscription } from '@/lib/telegram';
import { scheduleAutoDelete, getStreamingUrls } from '@/lib/movies';
import { InlineKeyboard } from 'grammy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, quality, rating, posterUrl, overview, type, tmdbId, fileId } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { success: false, error: 'User ID and Movie title are required' },
        { status: 400 }
      );
    }

    const numericUserId = Number(userId);

    // 1. Enforce Channel Subscription Check
    const subCheck = await checkUserSubscription(numericUserId);
    if (!subCheck.subscribed) {
      return NextResponse.json({
        success: false,
        notSubscribed: true,
        channelUsername: subCheck.channelUsername,
        channelUrl: subCheck.channelUrl,
        error: `Please join ${subCheck.channelUsername} first to unlock HD downloads!`,
      });
    }

    // 2. Resolve Streaming / Download URLs
    const urls = getStreamingUrls(tmdbId || 533535, type || 'movie');

    // 3. Prepare copyright notice caption
    const caption =
      `🎬 **${title}** • [${quality || '1080p Full HD'}]\n` +
      `⭐️ **Rating:** ${rating || '8.5'}/10 | ${type === 'tv' ? '📺 TV Series' : '🍿 Movie'}\n\n` +
      `📝 _${overview ? overview.slice(0, 160) + '...' : 'HD release available now' }_\n\n` +
      `⚠️ **COPYRIGHT SELF-DESTRUCT NOTICE:**\n` +
      `🛡️ This message & links will **AUTOMATICALLY DELETE IN 3 HOURS** to prevent copyright strikes.\n` +
      `📥 **Forward or save this to your "Saved Messages" right now** to keep it forever!\n\n` +
      `⚡ Enjoy streaming on @${process.env.NEXT_PUBLIC_BOT_USERNAME || 'FlowLoadvbot'}`;

    const keyboard = new InlineKeyboard()
      .url('▶️ Watch / Stream Online (Full HD)', urls.playerUrl)
      .row()
      .url('📥 Fast Download (Browser / VLC)', urls.streamUrl)
      .row()
      .url('💬 Official Channel', subCheck.channelUrl)
      .webApp('🍿 Open Cinema App', process.env.NEXT_PUBLIC_APP_URL || 'https://flow-load-chi.vercel.app');

    let sentMsg;

    // If an actual Telegram file_id was provided, send the real Telegram video!
    if (fileId) {
      try {
        sentMsg = await bot.api.sendVideo(numericUserId, fileId, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      } catch (err) {
        console.warn('Could not send native video with fileId, falling back to photo:', err);
      }
    }

    // Otherwise send rich photo card with stream/download buttons
    if (!sentMsg) {
      if (posterUrl && posterUrl.startsWith('http')) {
        sentMsg = await bot.api.sendPhoto(numericUserId, posterUrl, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      } else {
        sentMsg = await bot.api.sendMessage(numericUserId, caption, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      }
    }

    // 4. Schedule 3-hour automatic deletion
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    await scheduleAutoDelete(numericUserId, sentMsg.message_id, THREE_HOURS_MS);

    return NextResponse.json({
      success: true,
      message: 'Movie sent to your Telegram chat! It will self-delete in 3 hours.',
      messageId: sentMsg.message_id,
      streamUrl: urls.playerUrl,
      downloadUrl: urls.streamUrl,
      autoDeleteHours: 3,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Failed to send movie';
    console.error('Error in /api/movies/send:', err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
