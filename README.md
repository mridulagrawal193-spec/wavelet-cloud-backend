# 🌊 Wavelet Cloud Backend API

Ultra-fast, high-performance audio streaming, HLS transcoding, lyrics, and owner analytics engine for **Wavelet Music**.

---

## ⚡ Features

1. **HTTP 206 Partial Content (Byte-Range Audio Delivery)**:
   - Instant seeking and 0ms scrubbing.
   - Streams audio chunks in real-time rather than downloading the entire song.
   - Client-side immutable audio caching.

2. **HLS (HTTP Live Streaming) Engine**:
   - Master `.m3u8` playlists and 6-second `.aac` segments.
   - Adaptive streaming for low-bandwidth cellular networks.

3. **Owner Analytics & Private Portal**:
   - Real-time active listeners counter (live heartbeat sessions).
   - Total listening time in hours.
   - Total offline downloads count.
   - Top streamed songs leaderboard.
   - Accessible via secret URL: `/api/analytics/dashboard?key=<OWNER_API_SECRET>`.

4. **Multi-Source Synchronized Lyrics API**:
   - High-speed caching layer with LRCLIB & LyricFind support.

5. **Storage Flexibility**:
   - Local disk storage for development.
   - Cloudflare R2 / AWS S3 / MinIO for production with $0 egress fees.

---

## 🚀 Quick Start (Local Development)

```bash
cd wavelet-cloud-backend

# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start development server
npm run dev
```

The server will be running at:
- **API Base:** `http://localhost:4000`
- **Owner Dashboard:** `http://localhost:4000/api/analytics/dashboard?key=wavelet_master_owner_key_2026`
- **Health Check:** `http://localhost:4000/api/health`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stream/:songId` | Byte-range audio stream (`Accept-Ranges: bytes`) |
| `GET` | `/api/stream/hls/:songId/playlist.m3u8` | HLS adaptive audio playlist |
| `GET` | `/api/songs` | Get song catalog or search (`?q=term`) |
| `POST` | `/api/songs/upload` | Ingest song audio + album art (`x-owner-key` required) |
| `GET` | `/api/lyrics` | Fetch synced lyrics (`?track_name=...&artist_name=...`) |
| `GET` | `/api/analytics/dashboard` | Visual Web Dashboard for the Owner |
| `GET` | `/api/analytics/stats` | JSON analytics data for Owner |
| `POST` | `/api/analytics/heartbeat` | Background client listening time pulse |
| `POST` | `/api/analytics/download` | Record song download event |

---

## 🐳 Docker Deployment

```bash
docker build -t wavelet-cloud .
docker run -p 4000:4000 wavelet-cloud
```
