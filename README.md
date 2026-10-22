# 🍿 FlowLoad - HD Series & Movies Search Bot & Cinema Mini App

A viral **Telegram Bot & Telegram Mini App** inspired by bots like `@hd_series_and_movies_bot`, built with **Next.js 16**, **Neon PostgreSQL**, and **grammY**.

---

## 🌟 Key Features

### 1. 🎬 HD Movies & TV Series Search & Streaming
- Search millions of movies and TV shows directly in Telegram chat or inside the Mini App.
- High-res posters, IMDb ratings, genres, and release years.
- Multi-quality options: **1080p Full HD**, **720p HD**, and **480p Mobile**.

### 2. 🛡️ 3-Hour Self-Destruct Protection (Anti-Copyright)
- To prevent copyright strikes and bot bans, all delivered media messages **automatically self-destruct and delete from the chat after 3 hours**.
- Clear user guidance: *"Save or forward to Saved Messages to keep forever"*.
- In-memory timers + database-backed persistent cleanup cron (`/api/cron/cleanup`).

### 3. 🔒 Force-Subscribe Growth Engine
- Converts visitors into subscribers of your official Telegram channel (`@FlowLoad`).
- Verifies subscription before unlocking movie downloads using Telegram's `getChatMember` API.

### 4. ⚡ All-in-One Social Video Downloader (Bonus)
- Downloader for **TikTok** (watermark-free 1080p), **Instagram Reels**, **YouTube Shorts**, **Twitter/X**, and **Pinterest**.


### 5. 🍿 Netflix-Style Telegram Mini App (TMA)
- Glassmorphic cinematic dark theme (`#07090E`).
- Trending Hero Carousel, Instant Search, Filter Chips (Movies, Series, Top Rated).
- Telegram native Haptic Feedback and "Send to Chat" functionality.

---

## 🚀 Hosting & Deployment Guide

### Step 1: Make your Bot an Admin in your Channel
1. Open your channel (`@FlowLoad`).
2. Go to **Channel Settings** → **Administrators** → **Add Administrator**.
3. Search **`@FlowLoadvbot`** and add it.

### Step 2: Configure Menu Button in @BotFather
1. Message **[@BotFather](https://t.me/BotFather)**, send `/mybots`, select your bot.
2. Select **Bot Settings** → **Menu Button** → **Configure menu button**.
3. Set your Mini App URL:
   ```text
   https://flow-load-chi.vercel.app
   ```
4. Set button text:
   ```text
   🍿 Open Cinema App
   ```

### Step 3: Deploy to Vercel
1. Push this project to your GitHub repository:
   ```bash
   git add .
   git commit -m "Build HD Series & Movies Search Bot with 3-hour auto-delete"
   git push origin main
   ```
2. In your Vercel Project Settings, add the Environment Variables:
   - `DATABASE_URL`: `your_neon_postgresql_url`
   - `TELEGRAM_BOT_TOKEN`: `your_bot_token`
   - `TELEGRAM_CHANNEL_USERNAME`: `@FlowLoad`
   - `NEXT_PUBLIC_BOT_USERNAME`: `FlowLoadvbot`
   - `NEXT_PUBLIC_APP_URL`: `https://flow-load-chi.vercel.app`
   - `TMDB_API_KEY`: *(Optional)* Your free TMDB API key for real-time live movie search

### Step 4: Webhook Activation
Your webhook is already registered, but if you update your domain, set:
```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<VERCEL_URL>/api/telegram
```