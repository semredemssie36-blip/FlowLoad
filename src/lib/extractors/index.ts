export interface ExtractedMedia {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'pinterest' | 'generic';
  title: string;
  thumbnail?: string;
  author?: string;
  duration?: string;
  downloadUrl: string;
  audioUrl?: string;
  quality?: string;
  sourceUrl: string;
}

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedMedia;
  error?: string;
}

/**
 * Detect the platform from a given URL
 */
export function detectPlatform(url: string): ExtractedMedia['platform'] {
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
 */
async function extractTikTok(url: string): Promise<ExtractionResult> {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 },
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
          audioUrl: data.music ? (data.music.startsWith('http') ? data.music : `https://www.tikwm.com${data.music}`) : undefined,
          quality: '1080p HD (No Watermark)',
          sourceUrl: url,
        },
      };
    }

    throw new Error(json.msg || 'Failed to parse TikTok video');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'TikTok extraction failed';
    return { success: false, error: message };
  }
}

/**
 * Twitter / X direct video extractor via FixTweet/vxTwitter API
 */
async function extractTwitter(url: string): Promise<ExtractionResult> {
  try {
    // Convert url to api.fxtwitter.com format
    const match = url.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/i);
    if (!match) {
      return { success: false, error: 'Invalid Twitter/X status URL' };
    }

    const username = match[1];
    const statusId = match[2];
    const apiUrl = `https://api.fxtwitter.com/${username}/status/${statusId}`;

    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'TelegramBot (like TwitterBot)' },
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
          sourceUrl: url,
        },
      };
    }

    return { success: false, error: 'No video media found in this tweet' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Twitter extraction failed';
    return { success: false, error: message };
  }
}

/**
 * Universal extractor using Cobalt public instances (Instagram, YouTube, Pinterest, etc.)
 */
async function extractWithCobalt(url: string, platform: ExtractedMedia['platform']): Promise<ExtractionResult> {
  const cobaltInstances = [
    'https://api.cobalt.tools/api/json',
    'https://cobalt-api.kwiatekm.pl/api/json',
  ];

  for (const instance of cobaltInstances) {
    try {
      const res = await fetch(instance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          vQuality: '1080',
          filenamePattern: 'basic',
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      if (data.url || data.picker) {
        const streamUrl = data.url || (data.picker && data.picker[0]?.url);
        return {
          success: true,
          data: {
            platform,
            title: `${platform.toUpperCase()} Media`,
            downloadUrl: streamUrl,
            thumbnail: data.picker?.[0]?.thumb,
            quality: 'HD Media',
            sourceUrl: url,
          },
        };
      }
    } catch {
      // Try next instance
      continue;
    }
  }

  return { success: false, error: `Could not extract media from ${platform}. Please check the link.` };
}

/**
 * Master extraction function
 */
export async function extractMedia(rawUrl: string): Promise<ExtractionResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { success: false, error: 'Please provide a valid URL' };
  }

  const url = rawUrl.trim();
  const platform = detectPlatform(url);

  switch (platform) {
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
