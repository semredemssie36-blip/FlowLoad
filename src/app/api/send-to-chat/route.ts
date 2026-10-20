import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, downloadUrl, title, author, platform } = body;

    if (!userId || !downloadUrl) {
      return NextResponse.json(
        { success: false, error: 'User ID and Download URL are required' },
        { status: 400 }
      );
    }

    const caption =
      `🎬 **${title || 'Media Download'}**\n` +
      `👤 ${author || platform?.toUpperCase() || 'Creator'}\n\n` +
      `⚡ Downloaded via @${process.env.NEXT_PUBLIC_BOT_USERNAME || 'FlowLoadvbot'}`;

    // Fetch raw video bytes and upload directly to Telegram as InputFile
    try {
      const { InputFile } = await import('grammy');
      const res = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!res.ok) throw new Error('Could not fetch video stream');

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Third-party provider returned an ad page instead of video');
      }

      const buffer = Buffer.from(await res.arrayBuffer());

      await bot.api.sendVideo(Number(userId), new InputFile(buffer, `${title || 'video'}.mp4`), {
        caption,
        parse_mode: 'Markdown',
      });

      return NextResponse.json({ success: true, message: 'Video delivered directly to chat' });
    } catch (videoError: unknown) {
      const errMessage = videoError instanceof Error ? videoError.message : 'Error sending video';
      console.warn('sendVideo InputFile error:', errMessage);
      
      return NextResponse.json(
        { success: false, error: errMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send to chat';
    console.error('send-to-chat error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
