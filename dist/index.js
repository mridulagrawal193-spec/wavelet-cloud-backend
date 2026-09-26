"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const stream_1 = require("./routes/stream");
const songs_1 = require("./routes/songs");
const lyrics_1 = require("./routes/lyrics");
const analytics_1 = require("./routes/analytics");
const jam_1 = require("./routes/jam");
const app = (0, express_1.default)();
// Security and CORS
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'x-user-id', 'x-owner-key'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Global Rate Limiter to prevent API abuse
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Serve uploads folder (album artwork, static media)
app.use('/uploads', express_1.default.static(path_1.default.resolve(config_1.config.storage.localDir)));
// Mount API Routes
app.use('/api/stream', stream_1.streamRouter);
app.use('/api/songs', songs_1.songsRouter);
app.use('/api/lyrics', lyrics_1.lyricsRouter);
app.use('/api/analytics', analytics_1.analyticsRouter);
app.use('/api/jam', jam_1.jamRouter);
// Health Check Endpoint
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Wavelet Cloud Streaming Engine',
        version: '1.0.0',
        uptime: process.uptime(),
        storageMode: config_1.config.storage.mode,
        timestamp: new Date().toISOString(),
    });
});
// Root welcome
app.get('/', (_req, res) => {
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
          <li><strong>Owner Analytics Dashboard:</strong> <a style="color:#38bdf8;" href="/api/analytics/dashboard?key=${config_1.config.ownerSecret}">View Portal</a></li>
        </ul>
      </body>
    </html>
  `);
});
// Centralized error handler
app.use((err, _req, res, _next) => {
    console.error('[Wavelet Cloud Error]', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Wavelet Cloud Server Error',
    });
});
app.listen(config_1.config.port, () => {
    console.log(`\n🎵 ==============================================`);
    console.log(`🚀 Wavelet Cloud Audio API running on http://localhost:${config_1.config.port}`);
    console.log(`📊 Owner Analytics Dashboard: http://localhost:${config_1.config.port}/api/analytics/dashboard?key=${config_1.config.ownerSecret}`);
    console.log(`==============================================\n`);
});
