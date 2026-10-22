'use client';

import React, { useState, useEffect } from 'react';
import {
  Film,
  Search,
  Download,
  Share2,
  Users,
  ShieldAlert,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Clipboard,
  X,
  Play,
  Flame,
  Tv,
  Radio,
  Zap,
} from 'lucide-react';

interface MovieItem {
  id: string | number;
  tmdbId?: number;
  title: string;
  type: 'movie' | 'tv';
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  rating: number;
  genres: string[];
  qualities?: string[];
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string) => void;
      };
    };
  }
}

export default function CinemaMiniApp() {
  const [activeTab, setActiveTab] = useState<'cinema' | 'downloader' | 'vip' | 'channel'>('cinema');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv' | 'top'>('all');
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [selectedQuality, setSelectedQuality] = useState('1080p Full HD');
  
  // Delivery State
  const [sendingMovie, setSendingMovie] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);

  // Social Downloader State
  const [downloadUrl, setDownloadUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedMedia, setExtractedMedia] = useState<any>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // User & Channel State
  const [user, setUser] = useState<{ id: number; name: string; username?: string }>({
    id: 10001,
    name: 'Movie Fan',
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [channelUsername, setChannelUsername] = useState('@FlowLoad');
  const [channelUrl, setChannelUrl] = useState('https://t.me/FlowLoad');
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize Telegram WebApp SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      if (tg.initDataUnsafe?.user) {
        setUser({
          id: tg.initDataUnsafe.user.id,
          name: tg.initDataUnsafe.user.first_name,
          username: tg.initDataUnsafe.user.username,
        });
      }
    }

    // Check membership and fetch initial trending movies
    fetchMovies('');
    checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      const res = await fetch(`/api/check-sub?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(data.subscribed);
        if (data.channelUsername) setChannelUsername(data.channelUsername);
        if (data.channelUrl) setChannelUrl(data.channelUrl);
      }
    } catch {}
  }

  async function fetchMovies(query: string) {
    setLoading(true);
    try {
      const url = query ? `/api/movies?q=${encodeURIComponent(query)}` : '/api/movies';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setMovies(data.data);
      }
    } catch (e) {
      console.warn('Failed to load movies:', e);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search Input Change
  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchQuery(val);
    fetchMovies(val);
  }

  // Open Movie Detail Modal
  function handleSelectMovie(movie: MovieItem) {
    setSelectedMovie(movie);
    setSelectedQuality(movie.qualities?.[0] || '1080p Full HD');
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  }

  // Send movie directly to Telegram chat with 3-hour self-destruct notice
  async function handleSendToChat() {
    if (!selectedMovie) return;

    setSendingMovie(true);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    try {
      const res = await fetch('/api/movies/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: selectedMovie.title,
          quality: selectedQuality,
          rating: selectedMovie.rating,
          posterUrl: selectedMovie.posterUrl,
          overview: selectedMovie.overview,
          type: selectedMovie.type,
          tmdbId: selectedMovie.tmdbId,
        }),
      });

      const data = await res.json();

      if (data.notSubscribed) {
        setShowSubModal(true);
        if (data.channelUrl) setChannelUrl(data.channelUrl);
        if (data.channelUsername) setChannelUsername(data.channelUsername);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not send movie to chat');
      }

      setSendSuccessMessage('Delivered to your Telegram chat! It will self-destruct in 3 hours.');
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send movie';
      setSendErrorMessage(msg);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setSendingMovie(false);
    }
  }

  // Social Media Link Extractor Handler
  async function handleExtractSocial() {
    if (!downloadUrl) return;
    setExtracting(true);
    setExtractError(null);
    setExtractedMedia(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: downloadUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract media');
      }
      setExtractedMedia(data.data);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Extraction error';
      setExtractError(msg);
    } finally {
      setExtracting(false);
    }
  }

  // Filter movies by selected pill
  const filteredMovies = movies.filter((m) => {
    if (filterType === 'movie') return m.type === 'movie';
    if (filterType === 'tv') return m.type === 'tv';
    if (filterType === 'top') return m.rating >= 8.5;
    return true;
  });

  const featuredMovie = movies[0];

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <Film size={20} color="#FFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="brand-name">FlowLoad</span>
              <span className="brand-badge">CINEMA</span>
            </div>
          </div>
        </div>

        <button
          className="user-badge-btn"
          onClick={() => setActiveTab('channel')}
        >
          <div className={`sub-indicator ${isSubscribed ? '' : 'pending'}`} />
          <span>{isSubscribed ? 'VIP Active' : 'Join VIP'}</span>
        </button>
      </header>

      {/* Main Tab Views */}
      {activeTab === 'cinema' && (
        <main>
          {/* Featured Hero Banner */}
          {featuredMovie && !searchQuery && (
            <div className="hero-card" onClick={() => handleSelectMovie(featuredMovie)}>
              <img
                src={featuredMovie.backdropUrl || featuredMovie.posterUrl}
                alt={featuredMovie.title}
                className="hero-backdrop"
              />
              <div className="hero-gradient" />
              <div className="hero-content">
                <span className="hero-tag">
                  <Flame size={12} /> #1 TRENDING THIS WEEK
                </span>
                <h1 className="hero-title">{featuredMovie.title}</h1>
                <div className="hero-meta">
                  <span className="rating-badge">
                    <Star size={13} fill="#FBBF24" color="#FBBF24" /> {featuredMovie.rating}
                  </span>
                  <span>•</span>
                  <span>{featuredMovie.releaseDate.slice(0, 4) || '2024'}</span>
                  <span>•</span>
                  <span className="quality-pill">1080p FULL HD</span>
                  <span>•</span>
                  <span style={{ color: '#00F2FE', fontWeight: 600 }}>
                    {featuredMovie.type === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                </div>
                <button className="hero-btn">
                  <Play size={16} fill="#FFF" /> Stream / Download Now
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search movies, TV shows, genres..."
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchQuery('');
                    fetchMovies('');
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="filter-pills">
            <button
              className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              🍿 All Titles
            </button>
            <button
              className={`filter-pill ${filterType === 'movie' ? 'active' : ''}`}
              onClick={() => setFilterType('movie')}
            >
              🎬 Movies
            </button>
            <button
              className={`filter-pill ${filterType === 'tv' ? 'active' : ''}`}
              onClick={() => setFilterType('tv')}
            >
              📺 TV Series
            </button>
            <button
              className={`filter-pill ${filterType === 'top' ? 'active' : ''}`}
              onClick={() => setFilterType('top')}
            >
              ⭐ Top Rated (8.5+)
            </button>
          </div>

          {/* Section Header */}
          <div className="section-header">
            <h2 className="section-title">
              {searchQuery ? `Results for "${searchQuery}"` : '🔥 Popular & Trending'}
            </h2>
            <span className="section-count">{filteredMovies.length} Available</span>
          </div>

          {/* Movie Grid */}
          <div className="movie-grid">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                className="movie-card"
                onClick={() => handleSelectMovie(movie)}
              >
                <div className="movie-poster-box">
                  <img src={movie.posterUrl} alt={movie.title} className="movie-poster" />
                  <div className="movie-overlay-badges">
                    <span className="type-badge">
                      {movie.type === 'tv' ? 'Series' : 'Movie'}
                    </span>
                    <span className="score-badge">
                      <Star size={11} fill="#FBBF24" color="#FBBF24" /> {movie.rating}
                    </span>
                  </div>
                </div>
                <div className="movie-info">
                  <h3 className="movie-name">{movie.title}</h3>
                  <div className="movie-footer-meta">
                    <span>{movie.releaseDate.slice(0, 4) || 'HD'}</span>
                    <span className="movie-quality-tag">1080p HD</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Social Media Downloader Tab */}
      {activeTab === 'downloader' && (
        <div className="downloader-box">
          <div className="paste-input-card">
            <div className="platforms-ribbon">
              <span className="platform-pill">TikTok 1080p</span>
              <span className="platform-pill">Instagram Reels</span>
              <span className="platform-pill">YouTube Shorts</span>
              <span className="platform-pill">Twitter / X</span>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
              ⚡ All-in-One Social Downloader
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Paste any public video link to download without watermarks.
            </p>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Paste TikTok, IG, YouTube, or X link..."
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                style={{ paddingLeft: '16px' }}
              />
            </div>

            <button
              className="send-to-chat-btn"
              onClick={handleExtractSocial}
              disabled={extracting || !downloadUrl}
            >
              {extracting ? (
                <>⏳ Extracting HD Video...</>
              ) : (
                <>
                  <Download size={18} /> Extract Video Stream
                </>
              )}
            </button>
          </div>

          {extractError && (
            <div className="alert-banner error">
              <AlertCircle size={18} /> {extractError}
            </div>
          )}

          {extractedMedia && (
            <div className="paste-input-card" style={{ animation: 'slideUp 0.3s ease' }}>
              {extractedMedia.thumbnail && (
                <img
                  src={extractedMedia.thumbnail}
                  alt={extractedMedia.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '12px',
                  }}
                />
              )}
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                {extractedMedia.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                👤 {extractedMedia.author || 'Creator'} • ⚡ {extractedMedia.quality || 'HD'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href={extractedMedia.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="send-to-chat-btn"
                  style={{ textDecoration: 'none' }}
                >
                  <Download size={16} /> Direct Download MP4
                </a>
                {extractedMedia.audioUrl && (
                  <a
                    href={extractedMedia.audioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="quality-option-btn"
                    style={{ textDecoration: 'none', justifyContent: 'center' }}
                  >
                    🎵 Extract MP3 Audio Only
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIP & Referral Tab */}
      {activeTab === 'vip' && (
        <div className="referral-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Sparkles size={24} color="#FBBF24" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>VIP Referral Rewards</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Invite friends to FlowLoad! Every friend who joins through your link gives you VIP points and bypasses download waiting times.
          </p>

          <div className="referral-stat-grid">
            <div className="stat-box">
              <div className="stat-num">500</div>
              <div className="stat-label">VIP Points</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: '#00F2FE' }}>3 Days</div>
              <div className="stat-label">Daily Streak</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: '#34D399' }}>0</div>
              <div className="stat-label">Friends Invited</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>YOUR UNIQUE REFERRAL LINK:</div>
            <div style={{ fontSize: '13px', color: '#00F2FE', wordBreak: 'break-all', fontWeight: 600 }}>
              {`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'FlowLoadvbot'}?start=ref_${user.id}`}
            </div>
          </div>

          <button
            className="send-to-chat-btn"
            onClick={() => {
              const link = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'FlowLoadvbot'}?start=ref_${user.id}`;
              navigator.clipboard?.writeText(link);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
          >
            <Share2 size={16} /> {copiedLink ? '✅ Link Copied to Clipboard!' : 'Share Referral Link'}
          </button>
        </div>
      )}

      {/* Channel Subscription Gate Tab */}
      {activeTab === 'channel' && (
        <div className="referral-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Radio size={24} color="#E50914" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Official Channel Gate</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            All users must be subscribed to our official channel <b>{channelUsername}</b> to unlock 1080p full movie downloads and prevent bot bans.
          </p>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: isSubscribed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(229, 9, 20, 0.1)',
              border: `1px solid ${isSubscribed ? '#10B981' : '#E50914'}`,
              marginBottom: '16px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '15px', color: isSubscribed ? '#34D399' : '#FF5A5F' }}>
              {isSubscribed ? '✅ You are Subscribed!' : '🔒 Subscription Inactive'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Channel: <b>{channelUsername}</b>
            </div>
          </div>

          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="send-to-chat-btn"
            style={{ textDecoration: 'none', marginBottom: '10px' }}
          >
            <ExternalLink size={16} /> Open Official Channel
          </a>

          <button
            className="quality-option-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={checkSubscription}
          >
            🔄 Check & Verify Subscription
          </button>
        </div>
      )}

      {/* Movie Detail Modal with 3-Hour Copyright Notice */}
      {selectedMovie && (
        <div className="modal-overlay" onClick={() => setSelectedMovie(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-image">
              <img
                src={selectedMovie.backdropUrl || selectedMovie.posterUrl}
                alt={selectedMovie.title}
                className="modal-backdrop-img"
              />
              <div className="modal-image-gradient" />
              <button className="modal-close-btn" onClick={() => setSelectedMovie(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <h2 className="modal-title">{selectedMovie.title}</h2>
              <div className="modal-meta-row">
                <span className="rating-badge">
                  <Star size={14} fill="#FBBF24" color="#FBBF24" /> {selectedMovie.rating} / 10
                </span>
                <span>•</span>
                <span>{selectedMovie.releaseDate.slice(0, 4) || '2024'}</span>
                <span>•</span>
                <span style={{ color: '#00F2FE', fontWeight: 600 }}>
                  {selectedMovie.type === 'tv' ? 'TV Series' : 'Movie'}
                </span>
              </div>

              {/* 3-Hour Copyright Notice Box */}
              <div className="copyright-notice-box">
                <div className="copyright-icon-wrap">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="copyright-title">⚠️ 3-Hour Self-Destruct Protection</div>
                  <div className="copyright-desc">
                    To comply with copyright laws and protect our servers from strikes, media files sent to your chat <b>AUTOMATICALLY SELF-DESTRUCT IN 3 HOURS</b>. Forward or save the file to your <b>Saved Messages</b> immediately to keep it permanently!
                  </div>
                </div>
              </div>

              <p className="modal-synopsis">{selectedMovie.overview}</p>

              {/* Quality Selector */}
              <label className="quality-select-label">Select Download Stream:</label>
              <div className="quality-options">
                {(selectedMovie.qualities || ['1080p Full HD (2.2 GB)', '720p HD (980 MB)', '480p Mobile (420 MB)']).map(
                  (q) => (
                    <button
                      key={q}
                      className={`quality-option-btn ${selectedQuality === q ? 'selected' : ''}`}
                      onClick={() => setSelectedQuality(q)}
                    >
                      <span>🎬 {q}</span>
                      {selectedQuality === q && <CheckCircle2 size={16} color="#E50914" />}
                    </button>
                  )
                )}
              </div>

              {/* Feedback Toasts */}
              {sendSuccessMessage && (
                <div className="alert-banner success">
                  <CheckCircle2 size={18} />
                  <span>{sendSuccessMessage}</span>
                </div>
              )}
              {sendErrorMessage && (
                <div className="alert-banner error">
                  <AlertCircle size={18} />
                  <span>{sendErrorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="modal-actions">
                <a
                  href={`https://multiembed.mov/?video_id=${selectedMovie.tmdbId || 533535}&tmdb=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="send-to-chat-btn"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #00F2FE, #4FACFE)',
                    color: '#07090E',
                    fontWeight: 800,
                  }}
                  onClick={() => {
                    const playerUrl = `https://multiembed.mov/?video_id=${selectedMovie.tmdbId || 533535}&tmdb=1`;
                    if (window.Telegram?.WebApp?.openLink) {
                      window.Telegram.WebApp.openLink(playerUrl);
                    }
                  }}
                >
                  <Play size={18} fill="#07090E" /> ▶️ Watch Movie in Player Now
                </a>

                <button
                  className="send-to-chat-btn"
                  onClick={handleSendToChat}
                  disabled={sendingMovie}
                >
                  {sendingMovie ? (
                    <>⏳ Sending to Telegram Chat...</>
                  ) : (
                    <>
                      <Download size={18} /> Send Video Links to Telegram Chat
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Force-Subscribe Modal (when user tries to download without subscribing) */}
      {showSubModal && (
        <div className="modal-overlay" onClick={() => setShowSubModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(229, 9, 20, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  border: '1px solid rgba(229, 9, 20, 0.4)',
                }}
              >
                <ShieldAlert size={28} color="#E50914" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
                Channel Subscription Required
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                To unlock HD movie streaming and support server bandwidth, please join our official Telegram channel <b>{channelUsername}</b>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={channelUrl}
                target="_blank"
                rel="noreferrer"
                className="send-to-chat-btn"
                style={{ textDecoration: 'none' }}
                onClick={() => {
                  if (window.Telegram?.WebApp?.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(channelUrl);
                  }
                }}
              >
                📢 Step 1: Join {channelUsername}
              </a>

              <button
                className="quality-option-btn"
                style={{ justifyContent: 'center' }}
                onClick={async () => {
                  await checkSubscription();
                  setShowSubModal(false);
                  handleSendToChat();
                }}
              >
                ✅ Step 2: I Have Joined (Verify & Download)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav">
        <button
          className={`nav-tab-btn ${activeTab === 'cinema' ? 'active' : ''}`}
          onClick={() => setActiveTab('cinema')}
        >
          <Film size={20} />
          <span>Cinema</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'downloader' ? 'active' : ''}`}
          onClick={() => setActiveTab('downloader')}
        >
          <Download size={20} />
          <span>Downloader</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'vip' ? 'active' : ''}`}
          onClick={() => setActiveTab('vip')}
        >
          <Users size={20} />
          <span>VIP & Ref</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'channel' ? 'active' : ''}`}
          onClick={() => setActiveTab('channel')}
        >
          <Radio size={20} />
          <span>Channel Gate</span>
        </button>
      </nav>
    </div>
  );
}
