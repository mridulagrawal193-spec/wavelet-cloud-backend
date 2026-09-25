import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { streamRouter } from './routes/stream';
import { songsRouter } from './routes/songs';
import { lyricsRouter } from './routes/lyrics';
import { analyticsRouter } from './routes/analytics';

const app = express();

// Security and CORS
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'x-user-id', 'x-owner-key'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter to prevent API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Serve uploads folder (album artwork, static media)
app.use('/uploads', express.static(path.resolve(config.storage.localDir)));

// Mount API Routes
app.use('/api/stream', streamRouter);
app.use('/api/songs', songsRouter);
app.use('/api/lyrics', lyricsRouter);
app.use('/api/analytics', analyticsRouter);

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Wavelet Cloud Streaming Engine',
    version: '1.0.0',
    uptime: process.uptime(),
    storageMode: config.storage.mode,
    timestamp: new Date().toISOString(),
  });
});

// Root welcome
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <html>
      <head><title>Wavelet Cloud Streaming Engine</title></head>
      <body style="background:#080C14;color:#f8fafc;font-family:sans-serif;padding:40px;">
        <h1 style="color:#00f2fe;">Wavelet Cloud Audio Streaming API</h1>
        <p>Production-ready high-performance streaming backend for Wavelet Music.</p>
        <ul>
          <li><strong>Audio Streams:</strong> <code>GET /api/stream/:songId</code> (HTTP 206 Byte-Range)</li>
          <li><strong>Song Catalog:</strong> <code>GET /api/songs</code></li>
          <li><strong>Lyrics Service:</strong> <code>GET /api/lyrics?track_name=...&artist_name=...</code></li>
          <li><strong>Owner Analytics Dashboard:</strong> <a style="color:#38bdf8;" href="/api/analytics/dashboard?key=${config.ownerSecret}">View Portal</a></li>
        </ul>
      </body>
    </html>
  `);
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Wavelet Cloud Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Wavelet Cloud Server Error',
  });
});

app.listen(config.port, () => {
  console.log(`\n🎵 ==============================================`);
  console.log(`🚀 Wavelet Cloud Audio API running on http://localhost:${config.port}`);
  console.log(`📊 Owner Analytics Dashboard: http://localhost:${config.port}/api/analytics/dashboard?key=${config.ownerSecret}`);
  console.log(`==============================================\n`);
});
