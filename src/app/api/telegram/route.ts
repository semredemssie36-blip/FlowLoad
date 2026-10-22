import { NextRequest, NextResponse } from 'next/server';
import { InlineKeyboard, webhookCallback } from 'grammy';
import { bot, checkUserSubscription, CHANNEL_USERNAME, APP_URL } from '@/lib/telegram';
import { extractMedia } from '@/lib/extractors';
import { searchMovies, scheduleAutoDelete, runAutoDeleteSweep } from '@/lib/movies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

let initialized = false;
function setupBotHandlers() {
  if (initialized) return;
  initialized = true;

  // Command: /start
  bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name || 'Friend';
    const payload = ctx.match; // Deep link e.g. ref_123 or movie_id

    const keyboard = new InlineKeyboard();
    if (APP_URL) {
      keyboard.webApp('🍿 Open HD Movies & Series App', APP_URL).row();
    }
    keyboard
      .url('📢 Official Channel', `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`)
      .row()
      .text('🔍 How to Search', 'help_search');

    await ctx.reply(
      `👋 **Welcome to FlowLoad, ${firstName}!**\n\n` +
      `🎬 **HD Movies & TV Series Search Bot**\n` +
      `⚡ **All-in-One Social Video Downloader**\n\n` +
      `🔥 **What you can do:**\n` +
      `1️⃣ **Search Movies & Series**: Just type the title (e.g. \`Dune\`, \`Breaking Bad\`, \`Avatar\`).\n` +
      `2️⃣ **Fast Downloads**: 1080p, 720p, and 480p streams.\n` +
      `3️⃣ **Self-Destruct Protection**: Files automatically self-delete after **3 hours** to keep the bot safe and avoid copyright bans.\n` +
      `4️⃣ **Media Downloader**: Paste any link from TikTok, Instagram, YouTube, X, or Pinterest!\n\n` +
      `👇 Tap **Open HD Movies & Series App** below to browse our full Netflix-style catalog!`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    );
  });

  // Help search callback
  bot.callbackQuery('help_search', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `🔍 **How to Search Movies & Series:**\n\n` +
      `Simply send me the name of any movie or show:\n` +
      `• \`Dune\`\n` +
      `• \`Deadpool\`\n` +
      `• \`Stranger Things\`\n` +
      `• \`Breaking Bad\`\n\n` +
      `Or launch the **Mini App** for full search with posters, ratings, and trailers!`,
      {
        reply_markup: APP_URL
          ? new InlineKeyboard().webApp('🍿 Launch Mini App', APP_URL)
          : undefined,
      }
    );
  });

  // Handle Callback queries
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    const chatId = ctx.chat?.id || userId;

    // 1. Force-sub verification for media downloader
    if (data.startsWith('check_sub:')) {
      const targetUrl = decodeURIComponent(data.replace('check_sub:', ''));
      const status = await checkUserSubscription(userId);

      if (status.subscribed) {
        await ctx.answerCallbackQuery({ text: '✅ Verified! Downloading your media now...' });
        await ctx.editMessageText('✅ **Thank you for subscribing!** Processing your link now...');
        await processAndSendMedia(chatId, targetUrl);
      } else {
        await ctx.answerCallbackQuery({
          text: `❌ You must join ${status.channelUsername} first to unlock downloads!`,
          show_alert: true,
        });
      }
      return;
    }

    // 2. Movie quality selection and delivery
    if (data.startsWith('get_movie:')) {
      // Format: get_movie:<title>:<quality>
      const parts = data.replace('get_movie:', '').split(':::');
      const title = parts[0] || 'Movie';
      const quality = parts[1] || '1080p';

      // Enforce channel subscription check
      const status = await checkUserSubscription(userId);
      if (!status.subscribed) {
        const keyboard = new InlineKeyboard()
          .url('📢 Join Channel', status.channelUrl)
          .row()
          .text('🔄 I Have Joined', `check_movie_sub:${encodeURIComponent(title)}:::${encodeURIComponent(quality)}`);

        await ctx.answerCallbackQuery();
        await ctx.reply(
          `🔒 **Subscription Required to Download**\n\n` +
          `To get **${title}** in **${quality}**, please subscribe to our official channel **${status.channelUsername}**.\n\n` +
          `1️⃣ Tap **Join Channel**\n` +
          `2️⃣ Tap **I Have Joined** to start streaming!`,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          }
        );
        return;
      }

      await ctx.answerCallbackQuery({ text: `🎬 Preparing ${title} (${quality})...` });
      await deliverMovieWithTimer(chatId, userId, title, quality);
      return;
    }

    // 3. Movie verify callback after user clicks "I Have Joined"
    if (data.startsWith('check_movie_sub:')) {
      const parts = data.replace('check_movie_sub:', '').split(':::');
      const title = decodeURIComponent(parts[0] || 'Movie');
      const quality = decodeURIComponent(parts[1] || '1080p');

      const status = await checkUserSubscription(userId);
      if (status.subscribed) {
        await ctx.answerCallbackQuery({ text: '✅ Verified! Sending movie file...' });
        await ctx.editMessageText(`✅ **Subscription Verified!** Delivering **${title}**...`);
        await deliverMovieWithTimer(chatId, userId, title, quality);
      } else {
        await ctx.answerCallbackQuery({
          text: `❌ You have not joined ${status.channelUsername} yet. Please join to continue!`,
          show_alert: true,
        });
      }
      return;
    }
  });

  // Handle Text Messages (Links OR Movie Search)
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;

    // Detect if message is a URL (TikTok, Instagram, YouTube, etc.)
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
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

      await processAndSendMedia(chatId, url);
      return;
    }

    // Treat non-URL message as a Movie or TV Series Search query!
    const query = text;
    const results = await searchMovies(query);

    if (!results || results.length === 0) {
      const keyboard = new InlineKeyboard();
      if (APP_URL) {
        keyboard.webApp('🍿 Browse Full Catalog in App', APP_URL);
      }

      await ctx.reply(
        `🔍 No exact matches found for **"${query}"**.\n\n` +
        `💡 Try checking your spelling or open our Mini App to browse trending movies & series!`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        }
      );
      return;
    }

    // Send the top matching movie result
    const movie = results[0];
    const caption =
      `🎬 **${movie.title}** (${movie.releaseDate.slice(0, 4) || '2024'})\n` +
      `⭐️ **Rating:** ${movie.rating}/10 | ${movie.type === 'tv' ? '📺 TV Series' : '🍿 Movie'}\n` +
      `🎭 **Genres:** ${movie.genres.join(', ')}\n\n` +
      `📖 _${movie.overview.length > 200 ? movie.overview.slice(0, 197) + '...' : movie.overview}_\n\n` +
      `⚠️ **3-HOUR AUTO-DELETE POLICY:**\n` +
      `All files sent by this bot automatically self-destruct in 3 hours to comply with copyright guidelines.\n\n` +
      `👇 **Select quality to download or stream:**`;

    const keyboard = new InlineKeyboard();
    if (movie.qualities && movie.qualities.length > 0) {
      movie.qualities.forEach((q) => {
        keyboard.text(`📥 ${q}`, `get_movie:${movie.title}:::${q}`).row();
      });
    } else {
      keyboard
        .text('📥 1080p Full HD', `get_movie:${movie.title}:::1080p`)
        .row()
        .text('📥 720p HD', `get_movie:${movie.title}:::720p`)
        .row();
    }

    if (APP_URL) {
      keyboard.webApp('🚀 Open in HD Mini App', APP_URL).row();
    }

    try {
      if (movie.posterUrl && movie.posterUrl.startsWith('http')) {
        await ctx.replyWithPhoto(movie.posterUrl, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      } else {
        await ctx.reply(caption, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      }
    } catch {
      await ctx.reply(caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  });

  // Handle Video / Document Upload by Admin
  bot.on(['message:video', 'message:document'], async (ctx) => {
    const file = ctx.message.video || ctx.message.document;
    if (file) {
      await ctx.reply(
        `📁 **File Received:**\n` +
        `• **File ID:** \`${file.file_id}\`\n` +
        `• **Size:** ${(Number(file.file_size || 0) / (1024 * 1024)).toFixed(1)} MB\n\n` +
        `💡 You can link this \`file_id\` to any movie in your database for instant 0-bandwidth delivery!`,
        { parse_mode: 'Markdown' }
      );
    }
  });
}

/**
 * Delivers movie file / link to user chat and schedules 3-hour automatic deletion
 */
async function deliverMovieWithTimer(
  chatId: number,
  userId: number,
  title: string,
  quality: string
) {
  const matches = await searchMovies(title);
  const movie = matches[0];
  const { getStreamingUrls } = await import('@/lib/movies');
  const urls = getStreamingUrls(movie?.tmdbId || 533535, movie?.type || 'movie');

  const keyboard = new InlineKeyboard()
    .url('▶️ Watch / Stream Online (Full HD)', urls.playerUrl)
    .row()
    .url('📥 Fast Download (Browser / VLC)', urls.streamUrl)
    .row()
    .url('📢 Official Channel', `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`)
    .webApp('🍿 Open Cinema App', APP_URL || 'https://flow-load-chi.vercel.app');

  const caption =
    `🍿 **${title}** • [${quality}]\n\n` +
    `⚡ **Status:** High-speed HD stream ready!\n\n` +
    `⚠️ **IMPORTANT COPYRIGHT WARNING:**\n` +
    `🛡️ This message and media links will **AUTOMATICALLY SELF-DESTRUCT IN 3 HOURS**.\n` +
    `📥 **Forward or save this to your "Saved Messages" immediately** to keep it forever!\n\n` +
    `🕒 _Self-destruct timer started: 3 hours remaining._`;

  let msg;
  if (movie?.posterUrl && movie.posterUrl.startsWith('http')) {
    msg = await bot.api.sendPhoto(chatId, movie.posterUrl, {
      caption,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } else {
    msg = await bot.api.sendMessage(chatId, caption, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  // Schedule auto-delete after 3 hours (3 * 3600 * 1000 ms)
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  await scheduleAutoDelete(chatId, msg.message_id, THREE_HOURS_MS);
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
      `Downloaded via @${process.env.NEXT_PUBLIC_BOT_USERNAME || 'FlowLoadvbot'}`;

    const keyboard = new InlineKeyboard();
    if (APP_URL) {
      keyboard.webApp('🍿 Open HD Movies App', APP_URL);
    }

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

      await bot.api.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
    } catch (videoError: unknown) {
      const errText = videoError instanceof Error ? videoError.message : 'Upload failed';
      console.warn('sendVideo InputFile error:', errText);

      await bot.api.editMessageText(
        chatId,
        statusMsg.message_id,
        `⚠️ **Direct extraction failed:** The upstream host blocked streaming.\n\nOpen our Mini App to download directly:`,
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
    // Run cleanup sweep asynchronously on webhook calls
    runAutoDeleteSweep().catch(() => {});
    return await webhookCallback(bot, 'std/http')(req);
  } catch (err) {
    console.error('Webhook execution error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    bot: process.env.NEXT_PUBLIC_BOT_USERNAME || 'FlowLoadvbot',
    channel: CHANNEL_USERNAME,
    service: 'HD Series & Movies Search + Downloader',
  });
}
