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
 * Instagram Reel & Video extractor via SnapSave engine
 */
async function extractInstagram(url: string): Promise<ExtractionResult> {
  try {
    const { snapsave } = await import('snapsave-media-downloader');
    const res = await snapsave(url);
    if (res.success && res.data?.media && res.data.media.length > 0) {
      const item = res.data.media[0];
      if (!item.url) {
        throw new Error('No media URL returned by Instagram scraper');
      }
      return {
        success: true,
        data: {
          platform: 'instagram',
          title: 'Instagram Reel / Video',
          thumbnail: item.thumbnail,
          author: 'Instagram Creator',
          downloadUrl: item.url,
          quality: 'HD Original',
          sourceUrl: url,
        },
      };
    }
  } catch (err: unknown) {
    console.error('SnapSave Instagram error:', err);
  }

  return {
    success: false,
    error: 'Could not extract Instagram video. Make sure the profile and post are public.',
  };
}

/**
 * YouTube Video & Shorts extractor
 */
async function extractYouTube(rawUrl: string): Promise<ExtractionResult> {
  try {
    // Normalize any YouTube URL (youtu.be/ID or youtube.com/shorts/ID) to https://www.youtube.com/watch?v=ID
    let videoId = '';
    const youtuBeMatch = rawUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    const shortsMatch = rawUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    const watchMatch = rawUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);

    if (youtuBeMatch) {
      videoId = youtuBeMatch[1];
    } else if (shortsMatch) {
      videoId = shortsMatch[1];
    } else if (watchMatch) {
      videoId = watchMatch[1];
    }

    const cleanUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : rawUrl.split('&')[0];

    const apiUrl = `https://loader.to/ajax/download.php?button=1&start=1&end=1&format=720&url=${encodeURIComponent(cleanUrl)}`;
    const startRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    if (startRes.ok) {
      const startJson = await startRes.json();
      
      // If cached download link is already present
      if (startJson.download_url) {
        return {
          success: true,
          data: {
            platform: 'youtube',
            title: startJson.title || 'YouTube Video',
            thumbnail: startJson.thumbnail_url || startJson.info?.image,
            author: 'YouTube',
            downloadUrl: startJson.download_url,
            quality: '720p HD MP4',
            sourceUrl: rawUrl,
          },
        };
      }

      if (startJson.id) {
        // Poll for download URL (up to 15 seconds)
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const pRes = await fetch(`https://lto2.affadaffa.com/api/progress?id=${startJson.id}`);
          if (!pRes.ok) continue;
          const p = await pRes.json();
          if (p.download_url) {
            return {
              success: true,
              data: {
                platform: 'youtube',
                title: p.title || startJson.title || 'YouTube Video',
                thumbnail: p.thumbnail_url || startJson.thumbnail_url,
                author: 'YouTube',
                downloadUrl: p.download_url,
                quality: '720p HD MP4',
                sourceUrl: rawUrl,
              },
            };
          }
        }
      }
    }
  } catch (err: unknown) {
    console.warn('YouTube extraction error:', err);
  }

  return {
    success: false,
    error: 'Could not extract YouTube video. Please try again in a few seconds.',
  };
}

/**
 * Twitter / X direct video extractor via FixTweet/vxTwitter API
 */
async function extractTwitter(url: string): Promise<ExtractionResult> {
  try {
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
    case 'instagram':
      return await extractInstagram(url);
    case 'youtube':
      return await extractYouTube(url);
    case 'twitter':
      return await extractTwitter(url);
    case 'pinterest':
    default:
      return await extractInstagram(url);
  }
}
