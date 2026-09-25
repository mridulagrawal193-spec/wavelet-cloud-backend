import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { config } from '../config';

export const analyticsRouter = Router();

/**
 * Middleware to secure owner endpoints
 */
function requireOwnerAuth(req: Request, res: Response, next: () => void) {
  const authKey = req.query.key || req.headers['x-owner-key'];
  if (authKey !== config.ownerSecret) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Access Denied - Wavelet Owner Portal</title></head>
        <body style="background:#0a0e17;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="background:#131b2a;padding:40px;border-radius:12px;border:1px solid #1f2d47;text-align:center;">
            <h2 style="color:#ff4d4d;margin-top:0;">🔒 403 Forbidden</h2>
            <p>You must provide the valid Wavelet Owner Secret Key to view analytics.</p>
            <p style="color:#8fa0b5;font-size:13px;">Format: /api/analytics/dashboard?key=YOUR_SECRET_KEY</p>
          </div>
        </body>
      </html>
    `);
  }
  next();
}

/**
 * Owner Visual Analytics Dashboard (Accessible in any Web Browser)
 * URL: /api/analytics/dashboard?key=YOUR_SECRET_KEY
 */
analyticsRouter.get('/dashboard', requireOwnerAuth, (req: Request, res: Response) => {
  const stats = analyticsService.getDashboardStats();

  const topSongsHtml = stats.topSongs
    .map(
      (s, i) => `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 14px 16px; color: #38bdf8; font-weight: 700;">#${i + 1}</td>
        <td style="padding: 14px 16px;">
          <div style="font-weight: 600; color: #f8fafc;">${s.title}</div>
          <div style="font-size: 13px; color: #94a3b8;">${s.artist}</div>
        </td>
        <td style="padding: 14px 16px; text-align: right; font-weight: 600; color: #10b981;">
          ${s.playCount.toLocaleString()} plays
        </td>
        <td style="padding: 14px 16px; text-align: right; color: #cbd5e1;">
          ${s.downloadsCount.toLocaleString()}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wavelet Cloud • Private Owner Dashboard</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #080C14;
          color: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 24px;
        }
        .container { max-width: 1100px; margin: 0 auto; }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          color: #000;
        }
        .badge-live {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid #10b981;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        .grid-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
          margin-bottom: 36px;
        }
        .card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .card-label {
          color: #94a3b8;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .card-value {
          font-size: 32px;
          font-weight: 800;
          color: #f8fafc;
        }
        .card-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 6px;
        }
        .table-wrap {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 14px;
          overflow: hidden;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        th {
          background: #1e293b;
          padding: 14px 16px;
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      </style>
      <meta http-equiv="refresh" content="25">
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">
            <div class="brand-logo">W</div>
            <div>
              <h2 style="margin: 0; font-size: 22px; font-weight: 800;">Wavelet Cloud Owner Portal</h2>
              <div style="font-size: 13px; color: #64748b;">Real-time Streaming & User Analytics • Auto-refreshes every 25s</div>
            </div>
          </div>
          <div>
            <span class="badge-live">
              <span class="live-dot"></span> LIVE ENGINE
            </span>
          </div>
        </div>

        <div class="grid-cards">
          <div class="card">
            <div class="card-label">Active Listeners Right Now</div>
            <div class="card-value" style="color: #38bdf8;">${stats.activeListenersNow}</div>
            <div class="card-sub">Real-time heartbeat sessions</div>
          </div>

          <div class="card">
            <div class="card-label">Total Listening Time</div>
            <div class="card-value" style="color: #a855f7;">${stats.totalListeningHours} <span style="font-size: 16px; font-weight: 600;">hrs</span></div>
            <div class="card-sub">Combined active music playback</div>
          </div>

          <div class="card">
            <div class="card-label">Offline Song Downloads</div>
            <div class="card-value" style="color: #10b981;">${stats.totalDownloads.toLocaleString()}</div>
            <div class="card-sub">Downloaded tracks on user devices</div>
          </div>

          <div class="card">
            <div class="card-label">Total Audio Streams</div>
            <div class="card-value" style="color: #f59e0b;">${stats.totalStreams.toLocaleString()}</div>
            <div class="card-sub">Total play sessions initiated</div>
          </div>
        </div>

        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h3 style="margin: 0 0 4px 0; font-size: 18px;">Top Performing Songs</h3>
            <span style="font-size: 13px; color: #64748b;">Most streamed and saved tracks across all Wavelet listeners</span>
          </div>
          <span style="font-size: 12px; color: #475569;">Updated: ${new Date(stats.timestamp).toLocaleTimeString()}</span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Rank</th>
                <th>Track & Artist</th>
                <th style="text-align: right;">Total Streams</th>
                <th style="text-align: right;">Offline Saves</th>
              </tr>
            </thead>
            <tbody>
              ${topSongsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

/**
 * JSON stats endpoint for owner app / scripts
 */
analyticsRouter.get('/stats', requireOwnerAuth, (_req: Request, res: Response) => {
  res.json(analyticsService.getDashboardStats());
});

/**
 * Listening heartbeat endpoint called by client app
 */
analyticsRouter.post('/heartbeat', (req: Request, res: Response) => {
  const { userId, seconds } = req.body;
  const uid = userId || (req.headers['x-user-id'] as string) || req.ip || 'anon';
  analyticsService.recordHeartbeat(uid, Number(seconds) || 30);
  res.json({ ok: true });
});

/**
 * Record offline download event
 */
analyticsRouter.post('/download', (req: Request, res: Response) => {
  const { songId, userId } = req.body;
  if (!songId) return res.status(400).json({ error: 'songId required' });
  const uid = userId || (req.headers['x-user-id'] as string) || req.ip || 'anon';
  analyticsService.recordDownload(songId, uid);
  res.json({ ok: true });
});
