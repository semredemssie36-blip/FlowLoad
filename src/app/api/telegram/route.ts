import { NextRequest, NextResponse } from 'next/server';
import { InlineKeyboard, webhookCallback } from 'grammy';
import { bot, checkUserSubscription, CHANNEL_USERNAME, APP_URL } from '@/lib/telegram';
import { extractMedia } from '@/lib/extractors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Initialize bot handlers once
let initialized = false;
function setupBotHandlers() {
  if (initialized) return;
  initialized = true;

  // Command: /start
  bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name || 'there';
    const userId = ctx.from?.id;

    const keyboard = new InlineKeyboard();
    if (APP_URL) {
      keyboard.webApp('🚀 Open Mini App', APP_URL).row();
    }
    keyboard.url('📢 Official Channel', `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`);

    await ctx.reply(
      `👋 **Welcome, ${firstName}!**\n\n` +
      `⚡ **All-in-One Fast Media Downloader**\n` +
      `Send me any link from **TikTok, Instagram, YouTube Shorts, Twitter/X, or Pinterest** to get instant HD watermark-free downloads.\n\n` +
      `✨ Tap **Open Mini App** below for full HD preview, audio extraction, and referral rewards!`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    );
  });

  // Handle Callback queries (e.g., verifying subscription)
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;

    if (data.startsWith('check_sub:')) {
      const targetUrl = decodeURIComponent(data.replace('check_sub:', ''));
      const status = await checkUserSubscription(userId);

      if (status.subscribed) {
        await ctx.answerCallbackQuery({ text: '✅ Verified! Downloading your media now...' });
        await ctx.editMessageText('✅ **Thank you for subscribing!** Processing your link now...');
        await processAndSendMedia(ctx.chat?.id || userId, targetUrl);
      } else {
        await ctx.answerCallbackQuery({
          text: `❌ You have not joined ${status.channelUsername} yet. Please join to continue!`,
          show_alert: true,
        });
      }
    }
  });

  // Handle any text message containing a link
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;

    // Detect if message has a link
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    if (!urlMatch) {
      await ctx.reply(
        '💡 Send me a valid link to download (TikTok, Instagram, YouTube, Twitter/X, Pinterest), or open our Mini App below!',
        {
          reply_markup: APP_URL
            ? new InlineKeyboard().webApp('🚀 Open Downloader Mini App', APP_URL)
            : undefined,
        }
      );
      return;
    }

    const url = urlMatch[0];

    // Check mandatory channel subscription
    const subStatus = await checkUserSubscription(userId);
    if (!subStatus.subscribed) {
      const keyboard = new InlineKeyboard()
        .url('📢 Join Channel', subStatus.channelUrl)
        .row()
        .text('🔄 I Have Joined', `check_sub:${encodeURIComponent(url)}`);

      await ctx.reply(
        `🔒 **Channel Membership Required**\n\n` +
        `To download HD watermark-free videos, please join our official announcement channel **${subStatus.channelUsername}**.\n\n` +
        `1️⃣ Click **Join Channel**\n` +
        `2️⃣ Click **I Have Joined** to receive your video!`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        }
      );
      return;
    }

    // Process and send media
    await processAndSendMedia(chatId, url);
  });
}

/**
 * Downloads and sends media directly into Telegram chat
 */
async function processAndSendMedia(chatId: number, url: string) {
  try {
    const statusMsg = await bot.api.sendMessage(chatId, '⏳ **Extracting high quality media...**', {
      parse_mode: 'Markdown',
    });

    const result = await extractMedia(url);

    if (!result.success || !result.data) {
      await bot.api.editMessageText(
        chatId,
        statusMsg.message_id,
        `❌ **Failed to download:** ${result.error || 'Could not extract video. Please check link.'}`
      );
      return;
    }

    const media = result.data;
    const caption =
      `✨ **${media.title}**\n` +
      `👤 ${media.author || media.platform.toUpperCase()}\n` +
      `⚡ ${media.quality || 'HD (No Watermark)'}\n\n` +
      `Downloaded via @${process.env.NEXT_PUBLIC_BOT_USERNAME || 'MediaDownloaderBot'}`;

    const keyboard = new InlineKeyboard();
    if (APP_URL) {
      keyboard.webApp('🚀 Open Mini App', APP_URL);
    }

    // Upload native video file directly to chat using InputFile
    try {
      const { InputFile } = await import('grammy');
      
      const fileRes = await fetch(media.downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const contentType = fileRes.headers.get('content-type') || '';
      if (!fileRes.ok || contentType.includes('text/html')) {
        throw new Error('Could not download clean video file (upstream returned ad or blocked stream)');
      }

      const buffer = Buffer.from(await fileRes.arrayBuffer());

      await bot.api.sendVideo(chatId, new InputFile(buffer, `${media.title || 'video'}.mp4`), {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });

      // Delete temporary "extracting" message
      await bot.api.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
    } catch (videoError: unknown) {
      const errText = videoError instanceof Error ? videoError.message : 'Upload failed';
      console.warn('sendVideo InputFile error:', errText);

      await bot.api.editMessageText(
        chatId,
        statusMsg.message_id,
        `⚠️ **Could not download this video directly:** The source host blocked direct extraction.\n\nPlease try another link or download via our Mini App!`,
        {
          reply_markup: keyboard,
        }
      );
    }
  } catch (err) {
    console.error('Error in processAndSendMedia:', err);
    await bot.api.sendMessage(
      chatId,
      '⚠️ An unexpected error occurred while processing your link. Please try again in a moment.'
    );
  }
}

// Setup handlers once
setupBotHandlers();

export async function POST(req: NextRequest) {
  try {
    return await webhookCallback(bot, 'std/http')(req);
  } catch (err) {
    console.error('Webhook execution error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    bot: process.env.NEXT_PUBLIC_BOT_USERNAME || 'active',
    channel: CHANNEL_USERNAME,
  });
}
