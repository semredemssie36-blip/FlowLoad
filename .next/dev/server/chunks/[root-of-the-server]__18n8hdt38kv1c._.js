module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

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
"[project]/src/app/api/extract/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$extractors$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/extractors/index.ts [app-route] (ecmascript)");
;
;
const runtime = 'nodejs';
const dynamic = 'force-dynamic';
async function POST(req) {
    try {
        const body = await req.json();
        const { url } = body;
        if (!url || typeof url !== 'string') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'A valid media URL is required'
            }, {
                status: 400
            });
        }
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$extractors$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractMedia"])(url);
        if (!result.success) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: result.error || 'Failed to extract media'
            }, {
                status: 422
            });
        }
        // Optional background log in PostgreSQL if userId is provided
        const userId = body.userId;
        if (userId && result.data) {
            try {
                const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
                const parsedUserId = BigInt(userId);
                // Ensure user exists before logging
                await db.user.upsert({
                    where: {
                        id: parsedUserId
                    },
                    create: {
                        id: parsedUserId,
                        firstName: 'User',
                        points: 100
                    },
                    update: {
                        lastActive: new Date()
                    }
                });
                await db.downloadLog.create({
                    data: {
                        userId: parsedUserId,
                        platform: result.data.platform,
                        url: url
                    }
                });
            } catch (logErr) {
                console.warn('Could not log download to database:', logErr);
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: result.data
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Server error occurred';
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: message
        }, {
            status: 500
        });
    }
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
];

//# sourceMappingURL=%5Broot-of-the-server%5D__18n8hdt38kv1c._.js.map