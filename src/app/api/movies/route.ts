import { NextRequest, NextResponse } from 'next/server';
import { getTrendingMedia, searchMovies } from '@/lib/movies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    let items = query ? await searchMovies(query) : await getTrendingMedia();

    if (type === 'movie') {
      items = items.filter((i) => i.type === 'movie');
    } else if (type === 'tv') {
      items = items.filter((i) => i.type === 'tv');
    }

    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Failed to fetch movies';
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
