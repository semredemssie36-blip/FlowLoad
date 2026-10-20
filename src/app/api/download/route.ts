import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'video.mp4';

  if (!targetUrl) {
    return new NextResponse('URL parameter missing', { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (!upstream.ok || !upstream.body) {
      // If direct streaming fails, redirect to source
      return NextResponse.redirect(targetUrl);
    }

    const contentType = upstream.headers.get('content-type') || 'video/mp4';

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.warn('Proxy download fallback:', err);
    return NextResponse.redirect(targetUrl);
  }
}
