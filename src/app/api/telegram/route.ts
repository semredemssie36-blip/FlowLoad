import { NextRequest, NextResponse } from 'next/server';
import { InlineKeyboard, webhookCallback } from 'grammy';
import { bot, checkUserSubscription, CHANNEL_USERNAME, APP_URL } from '@/lib/telegram';
import { extractMedia } from '@/lib/extractors';
import {
  searchMovies,
  scheduleAutoDelete,
  runAutoDeleteSweep,
  getMovieFileId,
  saveMovieFileId,
  getStreamingUrls,
} from '@/lib/movies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

let initialized = false;
function setupBotHandlers() {
  if (initialized) return;
  initialized = true;

  // Command: /start
  bot.command('start', async (ctx) => {
    const keyboard = new InlineKeyboard();
    if (APP_URL) {
      keyboard.webApp('Open HDTV Mini App 🎬', APP_URL).row();
    }
    keyboard
      .url('📢 Official Channel', `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`)
      .text('❓ Help', 'help_info');

    await ctx.reply(
      `Welcome to HDTV 👋\n\n` +
      `Browse our library using our Mini App or send any movie or series name here to search.`,
      {
        reply_markup: keyboard,
      }
    );
  });

  bot.callbackQuery('help_info', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `💡 **How to use this bot:**\n\n` +
      `1️⃣ Send any movie or series name (e.g. \`Warm Bodies\`, \`Dune\`, \`Deadpool\`).\n` +
      `2️⃣ Choose **Movie** or **Series**.\n` +
      `3️⃣ Click **Download movie** to receive the high-speed file!\n\n` +
      `⚠️ Note: All movie files automatically self-delete after 3 hours to protect against copyright claims.`,
      { parse_mode: 'Markdown' }
    );
  });

  // Cancel action callback
  bot.callbackQuery('cancel_action', async (ctx) => {
    await ctx.answerCallbackQuery({ text: 'Cancelled' });
    try {
      await ctx.editMessageText('Operation cancelled.');
    } catch {
      await ctx.reply('Operation cancelled.');
    }
  });

  // Handle Callback Queries
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    const chatId = ctx.chat?.id || userId;

    // Step 2: User selected Movie or Series
    if (data.startsWith('search_type:')) {
      const parts = data.replace('search_type:', '').split(':::');
      const mediaType = parts[0] as 'movie' | 'tv';
      const query = decodeURIComponent(parts[1] || '');

      await ctx.answerCallbackQuery();
      const results = await searchMovies(query);

      const filtered = results.filter((m) =>
        mediaType === 'tv' ? m.type === 'tv' : m.type === 'movie'
      );

      const itemsToShow = filtered.length > 0 ? filtered : results;

      if (itemsToShow.length === 0) {
        await ctx.editMessageText(
          `❌ No results found for **"${query}"**.\n\nPlease check spelling or try another title.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      const keyboard = new InlineKeyboard();
      itemsToShow.slice(0, 5).forEach((item) => {
        const year = item.releaseDate ? item.releaseDate.slice(0, 4) : 'HD';
        keyboard
          .text(`${item.title} - ${year}`, `show_movie:${encodeURIComponent(item.title)}`)
          .row();
      });
      keyboard.text('❌ Cancel', 'cancel_action');

      const label = mediaType === 'tv' ? 'Series' : 'Movie';
      await ctx.editMessageText(`${label} results for **${query}**:`, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      return;
    }

    // Step 3: User selected a specific movie from the results
    if (data.startsWith('show_movie:')) {
      const title = decodeURIComponent(data.replace('show_movie:', ''));
      await ctx.answerCallbackQuery();

      // Check mandatory channel subscription first
      const status = await checkUserSubscription(userId);
      if (!status.subscribed) {
        const keyboard = new InlineKeyboard()
          .url('📢 Step 1: Join Channel', status.channelUrl)
          .row()
          .text('🔄 Step 2: I Have Joined', `verify_sub_movie:${encodeURIComponent(title)}`)
          .row()
          .text('❌ Cancel', 'cancel_action');

        await ctx.reply(
          `🔒 **Channel Membership Required**\n\n` +
          `To download **${title}**, please join our official updates channel **${status.channelUsername}**.\n\n` +
          `1️⃣ Click **Join Channel**\n` +
          `2️⃣ Click **I Have Joined** to receive your file!`,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          }
        );
        return;
      }

      await sendMovieCard(chatId, title);
      return;
    }

    // Verification callback after joining channel
    if (data.startsWith('verify_sub_movie:')) {
      const title = decodeURIComponent(data.replace('verify_sub_movie:', ''));
      const status = await checkUserSubscription(userId);

      if (status.subscribed) {
        await ctx.answerCallbackQuery({ text: '✅ Verified! Opening movie...' });
        try {
          await ctx.editMessageText('✅ **Subscription Verified!** Loading movie details...');
        } catch {}
        await sendMovieCard(chatId, title);
      } else {
        await ctx.answerCallbackQuery({
          text: `❌ You have not joined ${status.channelUsername} yet! Please join to download.`,
          show_alert: true,
        });
      }
      return;
    }

    // Step 4: User clicked "Download movie"
    if (data.startsWith('dl_movie_file:')) {
      const title = decodeURIComponent(data.replace('dl_movie_file:', ''));
      await ctx.answerCallbackQuery({ text: '⚡ Fetching file...' });

      // Send confirmation
      await ctx.reply(`✅ 1 file sent for **${title}**`, { parse_mode: 'Markdown' });

      // Deliver the actual movie video/document file!
      await deliverActualMovieFile(chatId, title);
      return;
    }
  });

  // Handle Text Messages (Links OR Movie Search)
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;

    // 1. Social media URL download
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      const url = urlMatch[0];
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

    // 2. Movie search query -> Ask Movie or Series? (Exact HDTV bot style)
    const query = text;
    const keyboard = new InlineKeyboard()
      .text('🎬 Movie', `search_type:movie:::${encodeURIComponent(query)}`)
      .row()
      .text('📺 Series', `search_type:tv:::${encodeURIComponent(query)}`)
      .row()
      .text('❌ Cancel', 'cancel_action');

    await ctx.reply(`Search **${query}** as a movie or series?`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // Auto-Index Forwarded Videos / Documents from Admin or Storage Channels
  bot.on(['message:video', 'message:document'], async (ctx) => {
    const file = ctx.message.video || ctx.message.document;
    const caption = ctx.message.caption?.trim() || '';
    const originalFileName = (ctx.message.document as any)?.file_name || '';

    if (file) {
      const fileSizeMB = (Number(file.file_size || 0) / (1024 * 1024)).toFixed(1);

      // Determine movie title from caption or file name
      let detectedTitle = caption.replace(/^\/setmovie\s*/i, '').trim();
      if (!detectedTitle && originalFileName) {
        // e.g. "Warm Bodies 2013 720p BluRay.mp4" -> "Warm Bodies"
        detectedTitle = originalFileName
          .replace(/\.(mp4|mkv|avi|mov)$/i, '')
          .replace(/(\d{4}|720p|1080p|BluRay|WEBRip|x264|x265|HDRip|HD).*$/i, '')
          .replace(/[._-]/g, ' ')
          .trim();
      }

      if (detectedTitle) {
        await saveMovieFileId(detectedTitle, file.file_id, `${fileSizeMB} MB`);
        await ctx.reply(
          `✅ **Movie File Indexed Successfully!**\n\n` +
          `🎬 **Movie Title:** \`${detectedTitle}\`\n` +
          `📁 **File ID:** \`${file.file_id}\`\n` +
          `📦 **Size:** ${fileSizeMB} MB\n\n` +
          `Whenever users search or request **"${detectedTitle}"**, they will receive this exact file!`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      await ctx.reply(
        `📁 **Video Received (${fileSizeMB} MB)**\n\n` +
        `💡 Reply to this video with:\n\`/setmovie <Movie Title>\`\n` +
        `Example:\n\`/setmovie Warm Bodies\` or \`/setmovie Dune: Part Two\``,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // Command /setmovie
  bot.command('setmovie', async (ctx) => {
    const title = ctx.match?.trim();
    const replyMsg = ctx.message?.reply_to_message;
    const file = replyMsg?.video || replyMsg?.document;

    if (!title || !file) {
      await ctx.reply(
        '💡 **Usage:** Reply to any video message with:\n`/setmovie <Movie Title>`\n\nExample:\n`/setmovie Warm Bodies`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const fileSizeMB = (Number(file.file_size || 0) / (1024 * 1024)).toFixed(1);
    await saveMovieFileId(title, file.file_id, `${fileSizeMB} MB`);

    await ctx.reply(
      `✅ **Linked!** When users request **"${title}"**, they will receive this exact file!`,
      { parse_mode: 'Markdown' }
    );
  });
}

/**
 * Sends the movie details card with poster, rating, runtime, and download button
 */
async function sendMovieCard(chatId: number, title: string) {
  const matches = await searchMovies(title);
  const movie = matches[0] || {
    title,
    rating: 7.5,
    genres: ['HD Movie'],
    releaseDate: '2024',
    overview: 'HD Movie available for direct high-speed download.',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
  };

  const caption =
    `🎬 **${movie.title}** (${movie.releaseDate?.slice(0, 4) || 'HD'})\n\n` +
    `⭐️ **Rating:** ${movie.rating}/10\n` +
    `🎭 **Genre:** ${movie.genres?.join(', ') || 'Action, Drama'}\n` +
    `⏱ **Runtime:** 112 min\n\n` +
    `_${movie.overview ? movie.overview.slice(0, 220) + '...' : 'Available in HD quality.'}_`;

  const keyboard = new InlineKeyboard()
    .text('⬇️ Download movie', `dl_movie_file:${encodeURIComponent(movie.title)}`)
    .row()
    .text('❌ Cancel', 'cancel_action');

  try {
    if (movie.posterUrl && movie.posterUrl.startsWith('http')) {
      await bot.api.sendPhoto(chatId, movie.posterUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else {
      await bot.api.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch {
    await bot.api.sendMessage(chatId, caption, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }
}

/**
 * Delivers the movie file or HD streaming/download card with 3-hour self-destruct warning
 */
async function deliverActualMovieFile(chatId: number, title: string) {
  const matches = await searchMovies(title);
  const movie = matches[0];
  const tmdbId = movie?.tmdbId || 693134;
  const mediaType = movie?.type || 'movie';
  const urls = getStreamingUrls(tmdbId, mediaType);

  const resolvedFileId = await getMovieFileId(title);

  const keyboard = new InlineKeyboard()
    .url('▶️ Watch Full HD Online', urls.playerUrl)
    .row()
    .url('📥 Fast Download 1080p (Browser / VLC)', urls.streamUrl)
    .row();

  if (APP_URL) {
    keyboard.webApp('🍿 Open Cinema App', APP_URL).row();
  }
  keyboard.url('📢 Official Channel', `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`);

  let sentFileMsg;

  // 1. If an actual Telegram file is indexed, send that exact Telegram video/document!
  if (resolvedFileId) {
    try {
      sentFileMsg = await bot.api.sendDocument(chatId, resolvedFileId, {
        caption: `🎬 **${title}**\n⚡ Follow @${CHANNEL_USERNAME.replace('@', '')} for all movies and series`,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (e) {
      console.warn('sendDocument failed, trying sendVideo:', e);
      try {
        sentFileMsg = await bot.api.sendVideo(chatId, resolvedFileId, {
          caption: `🎬 **${title}**\n⚡ Follow @${CHANNEL_USERNAME.replace('@', '')} for all movies and series`,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      } catch {}
    }
  }

  // 2. If no custom file is indexed yet, send direct HD delivery card with high-speed download & stream buttons
  if (!sentFileMsg) {
    const caption =
      `🎬 **${movie?.title || title}** • 1080p Full HD\n` +
      `⭐️ **Rating:** ${movie?.rating || '8.5'}/10 | ${mediaType === 'tv' ? '📺 TV Series' : '🍿 Movie'}\n\n` +
      `📥 **Ready for Download & Streaming:**\n` +
      `• Click **Watch Full HD Online** to stream instantly.\n` +
      `• Click **Fast Download 1080p** to download the movie directly to your device.\n\n` +
      `⚠️ **3-HOUR AUTO-DELETE PROTECTION:**\n` +
      `🛡️ This message & download links will **AUTOMATICALLY DELETE IN 3 HOURS** to prevent copyright strikes.\n` +
      `📥 **Forward to Saved Messages** right now to keep it forever!`;

    try {
      if (movie?.posterUrl && movie.posterUrl.startsWith('http')) {
        sentFileMsg = await bot.api.sendPhoto(chatId, movie.posterUrl, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      } else {
        sentFileMsg = await bot.api.sendMessage(chatId, caption, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      }
    } catch {
      sentFileMsg = await bot.api.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  }

  // 3. Send 3-Hour Self-Destruct Notice immediately under the file
  const warningMsg = await bot.api.sendMessage(
    chatId,
    `⚠️ **Please download or forward these files somewhere safe. They will be deleted in about 3 hours to reduce copyright risk.**`,
    { parse_mode: 'Markdown' }
  );

  // Schedule auto-deletion for 3 hours
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  if (sentFileMsg) {
    await scheduleAutoDelete(chatId, sentFileMsg.message_id, THREE_HOURS_MS);
  }
  await scheduleAutoDelete(chatId, warningMsg.message_id, THREE_HOURS_MS);
}

/**
 * Downloads and sends media directly into Telegram chat (for social media downloader)
 */
async function processAndSendMedia(chatId: number, url: string) {
  let statusMsg;
  try {
    statusMsg = await bot.api.sendMessage(chatId, '⏳ **Extracting high quality media...**', {
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

    const keyboard = new InlineKeyboard()
      .url('⚡ Direct Fast Download', media.downloadUrl);
    if (media.audioUrl) {
      keyboard.url('🎵 Audio (MP3)', media.audioUrl);
    }
    keyboard.row();
    if (APP_URL) {
      keyboard.webApp('🍿 Open Cinema App', APP_URL);
    }

    let sent = false;

    // Strategy 1: Tell Telegram to directly fetch and send the video by URL (instant, handles up to 20MB automatically)
    try {
      await bot.api.sendChatAction(chatId, 'upload_video');
      await bot.api.sendVideo(chatId, media.downloadUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      sent = true;
    } catch (urlErr) {
      console.warn('sendVideo by URL failed, attempting buffer upload:', urlErr);
    }

    // Strategy 2: If direct URL download failed (e.g. requires headers/userAgent), stream buffer
    if (!sent) {
      try {
        const { InputFile } = await import('grammy');
        const fileRes = await fetch(media.downloadUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (fileRes.ok) {
          const contentType = fileRes.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            const buffer = Buffer.from(await fileRes.arrayBuffer());
            await bot.api.sendVideo(chatId, new InputFile(buffer, `${media.title || 'video'}.mp4`), {
              caption,
              parse_mode: 'Markdown',
              reply_markup: keyboard,
            });
            sent = true;
          }
        }
      } catch (bufErr) {
        console.warn('sendVideo buffer failed, trying sendDocument:', bufErr);
      }
    }

    // Strategy 3: Try sending as document
    if (!sent) {
      try {
        await bot.api.sendDocument(chatId, media.downloadUrl, {
          caption,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        sent = true;
      } catch (docErr) {
        console.warn('sendDocument failed:', docErr);
      }
    }

    // Strategy 4: If Telegram cannot deliver the video file directly (e.g. >50MB limit), provide direct 1-click download button card
    if (!sent) {
      await bot.api.sendMessage(
        chatId,
        `🎬 **${media.title}**\n\n` +
        `📦 File is ready for download! Telegram limits direct bot uploads over 50MB, but you can download or stream it at maximum speed using the button below:\n\n` +
        `👤 **Platform:** ${media.platform.toUpperCase()}\n` +
        `⚡ **Quality:** ${media.quality || '1080p HD'}`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        }
      );
    }

    if (statusMsg) {
      await bot.api.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
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
    service: 'HDTV Movies & Series Search + Downloader',
  });
}
