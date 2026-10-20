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

    try {
      await bot.api.sendVideo(Number(userId), downloadUrl, {
        caption,
        parse_mode: 'Markdown',
      });
      return NextResponse.json({ success: true, message: 'Video delivered to chat' });
    } catch (videoError: unknown) {
      console.warn('sendVideo error, sending direct file message:', videoError);
      
      // If direct video fails, send as document or message with direct stream link
      await bot.api.sendDocument(Number(userId), downloadUrl, {
        caption,
        parse_mode: 'Markdown',
      }).catch(async () => {
        await bot.api.sendMessage(
          Number(userId),
          `🎬 **${title || 'Your Video'}** is ready!\n\nTap below to download directly:\n${downloadUrl}`
        );
      });

      return NextResponse.json({ success: true, message: 'Delivered to chat' });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send to chat';
    console.error('send-to-chat error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
