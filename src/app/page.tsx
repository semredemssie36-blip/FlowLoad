'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Clipboard,
  Sparkles,
  Share2,
  Users,
  CheckCircle2,
  AlertCircle,
  Music,
  Film,
  Zap,
  Gift,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';

interface ExtractedMedia {
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

export default function MiniApp() {
  const [activeTab, setActiveTab] = useState<'home' | 'referrals' | 'quests'>('home');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<ExtractedMedia | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Telegram User & Membership State
  const [user, setUser] = useState<{ id: number; name: string; username?: string }>({
    id: 10001,
    name: 'Explorer',
  });
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [channelUsername, setChannelUsername] = useState('@YourChannel');
  const [channelUrl, setChannelUrl] = useState('https://t.me');
  const [referralsCount, setReferralsCount] = useState(3);

  // Initialize Telegram WebApp SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        setUser({
          id: u.id,
          name: u.first_name,
          username: u.username,
        });

        // Sync user with PostgreSQL database
        fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: u.id,
            firstName: u.first_name,
            username: u.username,
          }),
        })
          .then((res) => res.json())
          .then((resData) => {
            if (resData.success && resData.user) {
              setReferralsCount(resData.user.referralsCount || 0);
            }
          })
          .catch(() => {});

        // Check channel subscription status
        fetch(`/api/check-sub?userId=${u.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.subscribed !== undefined) {
              setIsSubscribed(data.subscribed);
              if (data.channelUsername) setChannelUsername(data.channelUsername);
              if (data.channelUrl) setChannelUrl(data.channelUrl);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const triggerHaptic = (type: 'medium' | 'success' | 'error' = 'medium') => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      if (type === 'success' || type === 'error') {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
      } else {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    }
  };

  const handlePaste = async () => {
    triggerHaptic('medium');
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith('http')) {
        setUrl(text);
        setError(null);
      }
    } catch {
      // Manual paste fallback
    }
  };

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    triggerHaptic('medium');
    setLoading(true);
    setError(null);
    setMedia(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), userId: user.id }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Could not fetch video. Please check the link.');
      }

      setMedia(json.data);
      triggerHaptic('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to extract media';
      setError(message);
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleShareReferral = () => {
    triggerHaptic('success');
    const botName = process.env.NEXT_PUBLIC_BOT_USERNAME || 'MediaDownloaderBot';
    const inviteLink = `https://t.me/${botName}?start=ref_${user.id}`;
    const shareText = `🚀 Download HD videos from TikTok (no watermark), Instagram, and YouTube Shorts for free!\n\n👉 Join here: ${inviteLink}`;

    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(tgShareUrl);
    } else {
      window.open(tgShareUrl, '_blank');
    }
  };

  const detectedPlatform = () => {
    const l = url.toLowerCase();
    if (l.includes('tiktok.com')) return 'TikTok';
    if (l.includes('instagram.com')) return 'Instagram';
    if (l.includes('youtube.com') || l.includes('youtu.be')) return 'YouTube';
    if (l.includes('twitter.com') || l.includes('x.com')) return 'Twitter / X';
    if (l.includes('pinterest.com') || l.includes('pin.it')) return 'Pinterest';
    return null;
  };

  return (
    <>
      {/* Header Profile */}
      <header className="header">
        <div className="user-badge">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-meta">
            <span className="user-name">{user.name}</span>
            <span className="user-status">⚡ VIP Member</span>
          </div>
        </div>

        <div className="vip-pill">
          <Sparkles size={14} />
          <span>PRO Free</span>
        </div>
      </header>

      {/* Mandatory Channel Subscription Warning if not joined */}
      {!isSubscribed && (
        <div className="channel-banner">
          <div className="channel-banner-header">
            <span className="channel-banner-title">
              <Flame size={18} color="#F59E0B" /> Unlock HD Downloads
            </span>
            <span style={{ fontSize: '11px', color: '#FCD34D', fontWeight: 700 }}>Mandatory</span>
          </div>
          <p className="channel-banner-desc">
            Subscribe to our official channel <b>{channelUsername}</b> to unlock fast watermark-free downloads and audio extraction.
          </p>
          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-channel"
            onClick={() => triggerHaptic('medium')}
          >
            📢 Join Official Channel <ArrowRight size={14} />
          </a>
        </div>
      )}

      {/* Tab 1: Home / Downloader */}
      {activeTab === 'home' && (
        <section>
          <div style={{ marginBottom: 16 }}>
            <h1 className="hero-title">
              Fast <span className="gradient-text">Media Downloader</span>
            </h1>
            <p className="hero-subtitle">
              Paste any link to download watermark-free HD videos and audio in seconds.
            </p>
          </div>

          {/* Platform chips */}
          <div className="platform-chips">
            {['TikTok', 'Instagram', 'YouTube', 'Twitter / X', 'Pinterest'].map((p) => {
              const active = detectedPlatform() === p;
              return (
                <div key={p} className={`platform-chip ${active ? 'active' : ''}`}>
                  <span>{p}</span>
                </div>
              );
            })}
          </div>

          {/* Input & Action */}
          <form onSubmit={handleExtract} className="input-wrapper">
            <div className="input-box">
              <input
                type="url"
                placeholder="Paste video link here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn-paste"
                onClick={handlePaste}
                title="Paste from clipboard"
              >
                <Clipboard size={14} />
                <span>Paste</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn-primary"
            >
              {loading ? (
                <span>⚡ Fetching HD Media...</span>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download Media</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div
              className="glass-card"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.08)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertCircle size={20} color="#EF4444" />
              <span style={{ fontSize: '13px', color: '#FCA5A5' }}>{error}</span>
            </div>
          )}

          {/* Extracted Media Preview */}
          {media && (
            <div className="glass-card preview-card">
              {media.thumbnail && (
                <div className="preview-media-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.thumbnail} alt={media.title} />
                  <span className="preview-platform-badge">{media.platform}</span>
                  {media.duration && <span className="preview-duration">{media.duration}</span>}
                </div>
              )}

              <h2 className="preview-title">{media.title}</h2>
              <p className="preview-author">{media.author || 'Creator'}</p>

              {/* Download buttons */}
              <div className="download-actions">
                <a
                  href={media.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-download-option"
                  download
                  onClick={() => triggerHaptic('success')}
                >
                  <div className="btn-download-left">
                    <Film size={20} color="#00F2FE" />
                    <div>
                      <div className="btn-download-title">Download HD Video</div>
                      <div className="btn-download-sub">No Watermark • 1080p</div>
                    </div>
                  </div>
                  <span className="btn-download-badge">FREE</span>
                </a>

                {media.audioUrl && (
                  <a
                    href={media.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-download-option"
                    download
                    onClick={() => triggerHaptic('success')}
                  >
                    <div className="btn-download-left">
                      <Music size={20} color="#8B5CF6" />
                      <div>
                        <div className="btn-download-title">Download Audio (MP3)</div>
                        <div className="btn-download-sub">High Quality Audio Stream</div>
                      </div>
                    </div>
                    <span className="btn-download-badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                      AUDIO
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Referrals (Viral Growth Engine) */}
      {activeTab === 'referrals' && (
        <section>
          <h1 className="hero-title">
            Invite Friends, <span className="gradient-text">Earn VIP</span>
          </h1>
          <p className="hero-subtitle">
            Share your invite link. Unlock unlimited batch downloads and priority speed for every friend who joins!
          </p>

          <div className="glass-card referral-card">
            <div className="referral-stats">
              <div className="stat-box">
                <div className="stat-value">{referralsCount}</div>
                <div className="stat-label">Friends Invited</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">Tier 1</div>
                <div className="stat-label">VIP Status</div>
              </div>
            </div>

            <div style={{ margin: '18px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              🎁 <b>Reward Milestones:</b>
              <ul style={{ paddingLeft: 18, marginTop: 8, lineHeight: 1.6 }}>
                <li>3 Friends: Remove all cooldown delays (Unlocked ✅)</li>
                <li>5 Friends: Unlock batch multi-link downloads</li>
                <li>10 Friends: Lifetime VIP badge & instant support</li>
              </ul>
            </div>

            <button onClick={handleShareReferral} className="btn-primary">
              <Share2 size={18} />
              <span>Share Invite Link</span>
            </button>
          </div>
        </section>
      )}

      {/* Tab 3: Quests & Channel */}
      {activeTab === 'quests' && (
        <section>
          <h1 className="hero-title">
            Channel <span className="gradient-text">Quests</span>
          </h1>
          <p className="hero-subtitle">
            Complete quick community tasks to support our channel and keep this service 100% free.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle2 size={24} color={isSubscribed ? '#10B981' : '#64748B'} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Join Announcement Channel</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{channelUsername}</div>
                </div>
              </div>
              <a
                href={channelUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-paste"
                style={{ textDecoration: 'none' }}
              >
                {isSubscribed ? 'Joined' : 'Join'}
              </a>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Gift size={24} color="#F59E0B" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Daily Login Streak</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Claim 100 XP every 24h</div>
                </div>
              </div>
              <button
                className="btn-paste"
                onClick={() => {
                  triggerHaptic('success');
                  alert('🎉 Daily bonus claimed! Streak: Day 2');
                }}
              >
                Claim
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Bottom Sticky Navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('medium');
            setActiveTab('home');
          }}
        >
          <Download size={20} />
          <span>Download</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'referrals' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('medium');
            setActiveTab('referrals');
          }}
        >
          <Users size={20} />
          <span>Friends</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('medium');
            setActiveTab('quests');
          }}
        >
          <Zap size={20} />
          <span>Quests</span>
        </button>
      </nav>
    </>
  );
}
