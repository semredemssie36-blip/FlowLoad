import { prisma } from './db';
import { bot } from './telegram';

export interface MovieSearchResult {
  id: string | number;
  tmdbId?: number;
  title: string;
  originalTitle?: string;
  type: 'movie' | 'tv';
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  rating: number;
  genres: string[];
  qualities?: string[];
  fileId?: string;
}

// Built-in curated popular & trending catalog so the bot and UI work instantly
export const CURATED_MOVIES: MovieSearchResult[] = [
  {
    id: 'dune-2',
    tmdbId: 693134,
    title: 'Dune: Part Two',
    type: 'movie',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
    releaseDate: '2024-03-01',
    rating: 8.6,
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    qualities: ['1080p Full HD (2.4 GB)', '720p HD (1.1 GB)', '480p Mobile (450 MB)'],
  },
  {
    id: 'deadpool-wolverine',
    tmdbId: 533535,
    title: 'Deadpool & Wolverine',
    type: 'movie',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/yDHYTjA3R0jFYba16jBB1jv8vg0.jpg',
    releaseDate: '2024-07-26',
    rating: 8.0,
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    qualities: ['1080p Full HD (2.2 GB)', '720p HD (980 MB)', '480p Mobile (420 MB)'],
  },
  {
    id: 'stranger-things',
    tmdbId: 66732,
    title: 'Stranger Things',
    type: 'tv',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    releaseDate: '2016-07-15',
    rating: 8.7,
    genres: ['Sci-Fi', 'Drama', 'Mystery'],
    qualities: ['Season 4 • 1080p', 'Season 3 • 1080p', 'Season 2 • 1080p', 'Season 1 • 1080p'],
  },
  {
    id: 'breaking-bad',
    tmdbId: 1396,
    title: 'Breaking Bad',
    type: 'tv',
    overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and decides to enter the dangerous world of drugs to secure his family financial future.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    releaseDate: '2008-01-20',
    rating: 9.5,
    genres: ['Crime', 'Drama', 'Thriller'],
    qualities: ['Season 1-5 Complete Pack • 1080p', 'Season 5 • 1080p', 'Season 4 • 1080p'],
  },
  {
    id: 'oppenheimer',
    tmdbId: 872585,
    title: 'Oppenheimer',
    type: 'movie',
    overview: 'The story of J. Robert Oppenheimer role in the development of the atomic bomb during World War II.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
    releaseDate: '2023-07-21',
    rating: 8.9,
    genres: ['Biography', 'Drama', 'History'],
    qualities: ['1080p Full HD (3.1 GB)', '720p HD (1.4 GB)', '480p Mobile (580 MB)'],
  },
  {
    id: 'the-boys',
    tmdbId: 76479,
    title: 'The Boys',
    type: 'tv',
    overview: 'A fun and irreverent take on what happens when superheroes abuse their superpowers rather than use them for good.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/nxxCPRGTzxR48jZtqC6dDffO4u0.jpg',
    releaseDate: '2019-07-26',
    rating: 8.7,
    genres: ['Action', 'Sci-Fi', 'Comedy'],
    qualities: ['Season 4 • 1080p', 'Season 3 • 1080p', 'Season 2 • 1080p'],
  },
  {
    id: 'interstellar',
    tmdbId: 157336,
    title: 'Interstellar',
    type: 'movie',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    releaseDate: '2014-11-07',
    rating: 8.7,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    qualities: ['1080p Full HD (2.8 GB)', '720p HD (1.2 GB)'],
  },
  {
    id: 'avatar-way-of-water',
    tmdbId: 76600,
    title: 'Avatar: The Way of Water',
    type: 'movie',
    overview: 'Set more than a decade after the events of the first film, learn the story of the Sully family, the trouble that follows them, and the battles they fight to stay alive.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg',
    releaseDate: '2022-12-16',
    rating: 7.7,
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    qualities: ['1080p Full HD (3.4 GB)', '720p HD (1.5 GB)', '480p Mobile (650 MB)'],
  },
  {
    id: 'house-of-the-dragon',
    tmdbId: 94997,
    title: 'House of the Dragon',
    type: 'tv',
    overview: 'The prequel to Game of Thrones chronicles the beginning of the end of House Targaryen and the events leading up to the Targaryen civil war.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/t9Xke5724fqW3429IOPpoACdaUR.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/etjA2o5jVf37tJkE2qZ3mD52U3x.jpg',
    releaseDate: '2022-08-21',
    rating: 8.4,
    genres: ['Drama', 'Fantasy', 'Action'],
    qualities: ['Season 2 • 1080p', 'Season 1 • 1080p'],
  },
  {
    id: 'inception',
    tmdbId: 27205,
    title: 'Inception',
    type: 'movie',
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    releaseDate: '2010-07-16',
    rating: 8.8,
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    qualities: ['1080p Full HD (2.3 GB)', '720p HD (1.0 GB)'],
  },
];

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

/**
 * Search movies and TV series
 */
export async function searchMovies(query: string): Promise<MovieSearchResult[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return CURATED_MOVIES;

  // 1. If TMDB key is provided, query TMDB multi-search
  if (TMDB_API_KEY) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          return json.results
            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
            .map((item: any) => ({
              id: `tmdb-${item.id}`,
              tmdbId: item.id,
              title: item.title || item.name || 'Untitled',
              type: (item.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv',
              overview: item.overview || 'No synopsis available.',
              posterUrl: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
              backdropUrl: item.backdrop_path
                ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200',
              releaseDate: item.release_date || item.first_air_date || 'N/A',
              rating: Number(item.vote_average?.toFixed(1) || '0'),
              genres: ['HD', item.media_type === 'tv' ? 'Series' : 'Movie'],
              qualities: ['1080p Full HD', '720p HD', '480p Mobile'],
            }));
        }
      }
    } catch (e) {
      console.warn('TMDB search error:', e);
    }
  }

  // 2. Fallback to curated catalog
  return CURATED_MOVIES.filter(
    (m) =>
      m.title.toLowerCase().includes(normalized) ||
      m.genres.some((g) => g.toLowerCase().includes(normalized)) ||
      m.overview.toLowerCase().includes(normalized)
  );
}

/**
 * Get trending movies and shows
 */
export async function getTrendingMedia(): Promise<MovieSearchResult[]> {
  if (TMDB_API_KEY) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.results && json.results.length > 0) {
          return json.results.slice(0, 15).map((item: any) => ({
            id: `tmdb-${item.id}`,
            tmdbId: item.id,
            title: item.title || item.name || 'Untitled',
            type: item.media_type === 'tv' ? 'tv' : 'movie',
            overview: item.overview || 'No synopsis available.',
            posterUrl: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
            backdropUrl: item.backdrop_path
              ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200',
            releaseDate: item.release_date || item.first_air_date || '2024',
            rating: Number(item.vote_average?.toFixed(1) || '8.0'),
            genres: ['Trending', item.media_type === 'tv' ? 'Series' : 'Movie'],
            qualities: ['1080p Full HD', '720p HD', '480p Mobile'],
          }));
        }
      }
    } catch (e) {
      console.warn('TMDB trending error:', e);
    }
  }
  return CURATED_MOVIES;
}

/**
 * Generate working stream and fast player URLs for movies and shows
 */
export function getStreamingUrls(tmdbId?: number, type: 'movie' | 'tv' = 'movie', season = 1, episode = 1) {
  const id = tmdbId || 693134; // default to Dune: Part Two if none provided
  if (type === 'tv') {
    return {
      streamUrl: `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
      playerUrl: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
    };
  }
  return {
    streamUrl: `https://vidsrc.cc/v2/embed/movie/${id}`,
    playerUrl: `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  };
}

/**
 * Schedule a Telegram message to be auto-deleted after X hours (Default: 3 hours)
 * This protects the bot and user against copyright flags.
 */
export async function scheduleAutoDelete(
  chatId: number,
  messageId: number,
  delayMs: number = 3 * 60 * 60 * 1000 // 3 hours
) {
  const deleteAt = new Date(Date.now() + delayMs);

  // 1. Save in database for persistent cleanup
  try {
    const autoDelete = (prisma as any).autoDeleteMessage;
    if (autoDelete) {
      await autoDelete.create({
        data: {
          chatId: BigInt(chatId),
          messageId,
          deleteAt,
        },
      });
    }
  } catch (err) {
    console.warn('Could not save auto-delete record in DB:', err);
  }

  // 2. If runtime stays alive, schedule in-memory deletion
  setTimeout(async () => {
    try {
      await bot.api.deleteMessage(chatId, messageId);
      console.log(`[AutoDelete] Message ${messageId} in chat ${chatId} successfully deleted.`);
      try {
        const autoDelete = (prisma as any).autoDeleteMessage;
        if (autoDelete) {
          await autoDelete.updateMany({
            where: { chatId: BigInt(chatId), messageId },
            data: { isDeleted: true },
          });
        }
      } catch {}
    } catch (e) {
      console.warn(`[AutoDelete] Failed to delete message ${messageId}:`, e);
    }
  }, delayMs);
}

/**
 * Sweep and delete all expired messages from DB
 */
export async function runAutoDeleteSweep(): Promise<number> {
  try {
    const autoDelete = (prisma as any).autoDeleteMessage;
    if (!autoDelete) return 0;

    const expired = await autoDelete.findMany({
      where: {
        deleteAt: { lte: new Date() },
        isDeleted: false,
      },
      take: 50,
    });

    let deletedCount = 0;
    for (const item of expired) {
      try {
        await bot.api.deleteMessage(Number(item.chatId), item.messageId);
        deletedCount++;
      } catch (err) {
        // Message might have already been deleted by user or Telegram
      }

      await autoDelete.update({
        where: { id: item.id },
        data: { isDeleted: true },
      });
    }

    return deletedCount;
  } catch (err) {
    console.error('Sweep error:', err);
    return 0;
  }
}

// In-memory cache for fast file delivery
const MOVIE_FILE_CACHE: Record<string, string> = {
  'dune: part two': '',
  'deadpool & wolverine': '',
};

/**
 * Get Telegram file_id for a movie title
 */
export async function getMovieFileId(title: string): Promise<string | null> {
  const norm = title.trim().toLowerCase();
  if (MOVIE_FILE_CACHE[norm]) return MOVIE_FILE_CACHE[norm];

  try {
    const movieFileModel = (prisma as any).movieFile;
    if (movieFileModel) {
      const found = await movieFileModel.findFirst({
        where: {
          title: {
            contains: title.trim(),
            mode: 'insensitive',
          },
        },
      });
      if (found?.fileId) {
        MOVIE_FILE_CACHE[norm] = found.fileId;
        return found.fileId;
      }
    }
  } catch (err) {
    console.warn('DB file_id query error:', err);
  }
  return null;
}

/**
 * Save Telegram file_id for a movie
 */
export async function saveMovieFileId(title: string, fileId: string, fileSize?: string): Promise<boolean> {
  const norm = title.trim().toLowerCase();
  MOVIE_FILE_CACHE[norm] = fileId.trim();

  try {
    const movieFileModel = (prisma as any).movieFile;
    if (movieFileModel) {
      await movieFileModel.create({
        data: {
          title: title.trim(),
          fileId: fileId.trim(),
          quality: '1080p Full HD',
          fileSize: fileSize || 'HD Video',
        },
      });
      return true;
    }
  } catch (err) {
    console.warn('DB file_id save error:', err);
  }
  return true;
}
