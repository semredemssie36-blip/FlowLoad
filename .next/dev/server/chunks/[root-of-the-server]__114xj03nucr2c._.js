module.exports = [
(()=>{"use strict";return[
"[project]/src/app/api/telegram/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$grammy$2f$out$2f$mod$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/grammy/out/mod.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/telegram.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$extractors$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/extractors/index.ts [app-route] (ecmascript)");
;
;
;
;
const runtime = 'nodejs';
const dynamic = 'force-dynamic';
// Initialize bot handlers once
let initialized = false;
function setupBotHandlers() {
    if (initialized) return;
    initialized = true;
    // Command: /start
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"].command('start', async (ctx)=>{
        const firstName = ctx.from?.first_name || 'there';
        const userId = ctx.from?.id;
        const keyboard = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$grammy$2f$out$2f$mod$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InlineKeyboard"]();
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_URL"]) {
            keyboard.webApp('🚀 Open Mini App', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_URL"]).row();
        }
        keyboard.url('📢 Official Channel', `https://t.me/${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CHANNEL_USERNAME"].replace('@', '')}`);
        await ctx.reply(`👋 **Welcome, ${firstName}!**\n\n` + `⚡ **All-in-One Fast Media Downloader**\n` + `Send me any link from **TikTok, Instagram, YouTube Shorts, Twitter/X, or Pinterest** to get instant HD watermark-free downloads.\n\n` + `✨ Tap **Open Mini App** below for full HD preview, audio extraction, and referral rewards!`, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    });
    // Handle Callback queries (e.g., verifying subscription)
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"].on('callback_query:data', async (ctx)=>{
        const data = ctx.callbackQuery.data;
        const userId = ctx.from.id;
        if (data.startsWith('check_sub:')) {
            const targetUrl = decodeURIComponent(data.replace('check_sub:', ''));
            const status = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["checkUserSubscription"])(userId);
            if (status.subscribed) {
                await ctx.answerCallbackQuery({
                    text: '✅ Verified! Downloading your media now...'
                });
                await ctx.editMessageText('✅ **Thank you for subscribing!** Processing your link now...');
                await processAndSendMedia(ctx.chat?.id || userId, targetUrl);
            } else {
                await ctx.answerCallbackQuery({
                    text: `❌ You have not joined ${status.channelUsername} yet. Please join to continue!`,
                    show_alert: true
                });
            }
        }
    });
    // Handle any text message containing a link
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"].on('message:text', async (ctx)=>{
        const text = ctx.message.text.trim();
        const userId = ctx.from.id;
        const chatId = ctx.chat.id;
        // Detect if message has a link
        const urlMatch = text.match(/https?:\/\/[^\s]+/i);
        if (!urlMatch) {
            await ctx.reply('💡 Send me a valid link to download (TikTok, Instagram, YouTube, Twitter/X, Pinterest), or open our Mini App below!', {
                reply_markup: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_URL"] ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$grammy$2f$out$2f$mod$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InlineKeyboard"]().webApp('🚀 Open Downloader Mini App', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_URL"]) : undefined
            });
            return;
        }
        const url = urlMatch[0];
        // Check mandatory channel subscription
        const subStatus = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["checkUserSubscription"])(userId);
        if (!subStatus.subscribed) {
            const keyboard = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$grammy$2f$out$2f$mod$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InlineKeyboard"]().url('📢 Join Channel', subStatus.channelUrl).row().text('🔄 I Have Joined', `check_sub:${encodeURIComponent(url)}`);
            await ctx.reply(`🔒 **Channel Membership Required**\n\n` + `To download HD watermark-free videos, please join our official announcement channel **${subStatus.channelUsername}**.\n\n` + `1️⃣ Click **Join Channel**\n` + `2️⃣ Click **I Have Joined** to receive your video!`, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            return;
        }
        // Process and send media
        await processAndSendMedia(chatId, url);
    });
}
/**
 * Downloads and sends media directly into Telegram chat
 */ async function processAndSendMedia(chatId, url) {
    try {
        const statusMsg = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"].api.sendMessage(chatId, '⏳ **Extracting high quality media...**', {
            parse_mode: 'Markdown'
        });
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$extractors$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractMedia"])(url);
        if (!result.success || !result.data) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"].api.editMessageText(chatId, statusMsg.message_id, `❌ **Failed to download:** ${result.error || 'Could not extract video. Please check link.'}`);
            return;
        }
        const media = result.data;
        const caption = `✨ **${media.title}**\n` + `👤 ${media.author || media.platform.toUpperCase()}\n` + `⚡ ${media.quality || 'HD (No Watermark)'}\n\n` + `Downloaded via @${("TURBOPACK compile-time value", "FlowLoadBot") || 'MediaDownloaderBot'}`;
        const keyboard = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$grammy$2f$out$2f$mod$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InlineKeyboard"]();
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_URL"]) {
            keyboard.webApp('🚀 Open Mini App', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_URL"]);
        }
        // Try sending as native video first
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"].api.sendVideo(chatId, media.downloadUrl, {
                caption,
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            // Delete temporary "extracting" message
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"].api.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
        } catch (videoError) {
            console.warn('sendVideo error, falling back to direct link:', videoError);
            // Fallback: Send clickable link button
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"].api.editMessageText(chatId, statusMsg.message_id, `🎬 **${media.title}**\n\nYour HD video is ready! Click the button below to download or view:`, {
                reply_markup: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$grammy$2f$out$2f$mod$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InlineKeyboard"]().url('📥 Download Video', media.downloadUrl).row().webApp('🚀 Open Mini App', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_URL"] || 'https://t.me')
            });
        }
    } catch (err) {
        console.error('Error in processAndSendMedia:', err);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"].api.sendMessage(chatId, '⚠️ An unexpected error occurred while processing your link. Please try again in a moment.');
    }
}
// Setup handlers once
setupBotHandlers();
async function POST(req) {
    try {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$grammy$2f$out$2f$mod$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["webhookCallback"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bot"], 'std/http')(req);
    } catch (err) {
        console.error('Webhook execution error:', err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Webhook processing failed'
        }, {
            status: 500
        });
    }
}
async function GET() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        status: 'online',
        bot: ("TURBOPACK compile-time value", "FlowLoadBot") || 'active',
        channel: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CHANNEL_USERNAME"]
    });
}
}),
"[project]/src/lib/extractors/index.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectPlatform",
    ()=>detectPlatform,
    "extractMedia",
    ()=>extractMedia
]);
function detectPlatform(url) {
    const lower = url.toLowerCase();
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('pinterest.com') || lower.includes('pin.it')) return 'pinterest';
    return 'generic';
}
/**
 * TikTok direct extractor via free public TikWM API (Fast, 1080p, no watermark)
 */ async function extractTikTok(url) {
    try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            next: {
                revalidate: 60
            }
        });
        if (!res.ok) throw new Error('TikWM fetch failed');
        const json = await res.json();
        if (json.code === 0 && json.data) {
            const data = json.data;
            const downloadUrl = data.play || data.wmplay || data.hdplay;
            return {
                success: true,
                data: {
                    platform: 'tiktok',
                    title: data.title || 'TikTok Video',
                    thumbnail: data.cover || data.origin_cover,
                    author: data.author?.nickname || data.author?.unique_id || 'TikTok Creator',
                    duration: data.duration ? `${data.duration}s` : undefined,
                    downloadUrl: downloadUrl.startsWith('http') ? downloadUrl : `https://www.tikwm.com${downloadUrl}`,
                    audioUrl: data.music ? data.music.startsWith('http') ? data.music : `https://www.tikwm.com${data.music}` : undefined,
                    quality: '1080p HD (No Watermark)',
                    sourceUrl: url
                }
            };
        }
        throw new Error(json.msg || 'Failed to parse TikTok video');
    } catch (err) {
        const message = err instanceof Error ? err.message : 'TikTok extraction failed';
        return {
            success: false,
            error: message
        };
    }
}
/**
 * Twitter / X direct video extractor via FixTweet/vxTwitter API
 */ async function extractTwitter(url) {
    try {
        // Convert url to api.fxtwitter.com format
        const match = url.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/i);
        if (!match) {
            return {
                success: false,
                error: 'Invalid Twitter/X status URL'
            };
        }
        const username = match[1];
        const statusId = match[2];
        const apiUrl = `https://api.fxtwitter.com/${username}/status/${statusId}`;
        const res = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'TelegramBot (like TwitterBot)'
            }
        });
        if (!res.ok) throw new Error('Failed to query Twitter API');
        const json = await res.json();
        if (json.tweet && json.tweet.media && json.tweet.media.videos && json.tweet.media.videos.length > 0) {
            const video = json.tweet.media.videos[0];
            return {
                success: true,
                data: {
                    platform: 'twitter',
                    title: json.tweet.text || 'X / Twitter Video',
                    thumbnail: video.thumbnail_url || json.tweet.media.mosaic?.formats?.jpeg,
                    author: `@${json.tweet.author?.screen_name || username}`,
                    duration: video.duration ? `${Math.round(video.duration)}s` : undefined,
                    downloadUrl: video.url,
                    quality: 'HD Video',
                    sourceUrl: url
                }
            };
        }
        return {
            success: false,
            error: 'No video media found in this tweet'
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Twitter extraction failed';
        return {
            success: false,
            error: message
        };
    }
}
/**
 * Universal extractor using Cobalt public instances (Instagram, YouTube, Pinterest, etc.)
 */ async function extractWithCobalt(url, platform) {
    const cobaltInstances = [
        'https://api.cobalt.tools/api/json',
        'https://cobalt-api.kwiatekm.pl/api/json'
    ];
    for (const instance of cobaltInstances){
        try {
            const res = await fetch(instance, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    vQuality: '1080',
                    filenamePattern: 'basic'
                })
            });
            if (!res.ok) continue;
            const data = await res.json();
            if (data.url || data.picker) {
                const streamUrl = data.url || data.picker && data.picker[0]?.url;
                return {
                    success: true,
                    data: {
                        platform,
                        title: `${platform.toUpperCase()} Media`,
                        downloadUrl: streamUrl,
                        thumbnail: data.picker?.[0]?.thumb,
                        quality: 'HD Media',
                        sourceUrl: url
                    }
                };
            }
        } catch  {
            continue;
        }
    }
    return {
        success: false,
        error: `Could not extract media from ${platform}. Please check the link.`
    };
}
async function extractMedia(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
        return {
            success: false,
            error: 'Please provide a valid URL'
        };
    }
    const url = rawUrl.trim();
    const platform = detectPlatform(url);
    switch(platform){
        case 'tiktok':
            return await extractTikTok(url);
        case 'twitter':
            return await extractTwitter(url);
        case 'instagram':
        case 'youtube':
        case 'pinterest':
        default:
            // Try platform-specific or Cobalt universal
            return await extractWithCobalt(url, platform);
    }
}
}),
"[project]/src/lib/telegram.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "APP_URL",
    ()=>APP_URL,
    "CHANNEL_ID",
    ()=>CHANNEL_ID,
    "CHANNEL_USERNAME",
    ()=>CHANNEL_USERNAME,
    "bot",
    ()=>bot,
    "checkUserSubscription",
    ()=>checkUserSubscription
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$grammy$2f$out$2f$mod$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/grammy/out/mod.js [app-route] (ecmascript)");
;
const token = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$grammy$2f$out$2f$mod$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Bot"](token);
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME || '@YourChannel';
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';
const APP_URL = ("TURBOPACK compile-time value", "http://localhost:3000") || '';
async function checkUserSubscription(userId) {
    const channelRef = CHANNEL_ID || CHANNEL_USERNAME;
    const channelUrl = CHANNEL_USERNAME.startsWith('@') ? `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` : `https://t.me/${CHANNEL_USERNAME}`;
    // If token or channel is not configured, treat as subscribed so dev/testing is smooth
    if (!token || !channelRef || channelRef === '@YourChannel') {
        return {
            subscribed: true,
            channelUsername: CHANNEL_USERNAME,
            channelUrl
        };
    }
    try {
        const member = await bot.api.getChatMember(channelRef, userId);
        const validStatuses = [
            'creator',
            'administrator',
            'member',
            'restricted'
        ];
        const isSubscribed = validStatuses.includes(member.status);
        return {
            subscribed: isSubscribed,
            channelUsername: CHANNEL_USERNAME,
            channelUrl
        };
    } catch (error) {
        console.warn(`[SubscriptionCheck] Could not verify membership for user ${userId}:`, error);
        // In case the bot was not made admin in the channel yet, allow or return false
        return {
            subscribed: false,
            channelUsername: CHANNEL_USERNAME,
            channelUrl
        };
    }
}
}),
]})(),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/punycode [external] (punycode, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/tty [external] (tty, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__114xj03nucr2c._.js.map