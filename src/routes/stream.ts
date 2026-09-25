import { Router, Request, Response } from 'express';
import { storageService } from '../services/storageService';
import { songDatabase } from '../services/songDatabase';
import { analyticsService } from '../services/analyticsService';

export const streamRouter = Router();

/**
 * High-Performance Byte-Range Audio Streaming Endpoint (HTTP 206 Partial Content)
 * Enables:
 * - 0ms instant scrub and seek
 * - Fast initial chunk delivery (Spotify / Apple Music style)
 * - Immutable client-side audio caching
 */
streamRouter.get('/:songId', async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const song = songDatabase.getById(songId);

    if (!song) {
      return res.status(404).json({ error: 'Song not found in Wavelet Cloud' });
    }

    // Track analytics play event asynchronously
    const userId = (req.headers['x-user-id'] as string) || req.ip || 'anonymous';
    analyticsService.recordStreamStart(songId, userId);

    const rangeHeader = req.headers.range;
    const fileKey = song.storageKey || `audio/${songId}.mp3`;

    if (!rangeHeader) {
      // Direct whole-file request
      const fileData = await storageService.getFileStream(fileKey);
      if (!fileData) {
        return res.status(404).json({ error: 'Audio file asset not found on storage backend' });
      }

      res.writeHead(200, {
        'Content-Type': fileData.contentType,
        'Content-Length': fileData.totalSize,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      });
      return fileData.stream.pipe(res);
    }

    // Parse Range Header (e.g., "bytes=0-1048576" or "bytes=1048576-")
    // Retrieve total file size first
    const probe = await storageService.getFileStream(fileKey);
    if (!probe) {
      return res.status(404).json({ error: 'Audio asset not found' });
    }

    const totalSize = probe.totalSize;
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    // Default chunk size is 1MB if end is not specified, preventing heavy buffer over-allocation
    const defaultChunk = 1024 * 1024; // 1 MB
    let end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + defaultChunk - 1, totalSize - 1);

    if (start >= totalSize || end >= totalSize) {
      res.setHeader('Content-Range', `bytes */${totalSize}`);
      return res.status(416).json({ error: 'Requested range not satisfiable' });
    }

    const fileChunk = await storageService.getFileStream(fileKey, { start, end });
    if (!fileChunk) {
      return res.status(500).json({ error: 'Failed to read audio chunk' });
    }

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': fileChunk.contentLength,
      'Content-Type': fileChunk.contentType,
      'Cache-Control': 'public, max-age=604800, immutable',
    });

    fileChunk.stream.pipe(res);
  } catch (err) {
    console.error('Streaming error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Streaming Engine Error' });
    }
  }
});

/**
 * HLS (HTTP Live Streaming) Master Playlist Route
 * Serves m3u8 playlist with adaptive bitrate tracks
 */
streamRouter.get('/hls/:songId/playlist.m3u8', async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const playlistKey = `hls/${songId}/playlist.m3u8`;

    const file = await storageService.getFileStream(playlistKey);
    if (!file) {
      return res.status(404).json({ error: 'HLS playlist not found for this track' });
    }

    res.writeHead(200, {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache',
    });
    file.stream.pipe(res);
  } catch (err) {
    console.error('HLS Playlist Error:', err);
    res.status(500).json({ error: 'HLS Stream error' });
  }
});

/**
 * HLS Audio Segment Delivery Route (.aac / .ts chunks)
 */
streamRouter.get('/hls/:songId/:segment', async (req: Request, res: Response) => {
  try {
    const { songId, segment } = req.params;
    const segmentKey = `hls/${songId}/${segment}`;

    const file = await storageService.getFileStream(segmentKey);
    if (!file) {
      return res.status(404).json({ error: 'HLS Segment chunk not found' });
    }

    res.writeHead(200, {
      'Content-Type': segment.endsWith('.aac') ? 'audio/aac' : 'video/MP2T',
      'Content-Length': file.totalSize,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    file.stream.pipe(res);
  } catch (err) {
    console.error('HLS Segment Error:', err);
    res.status(500).json({ error: 'HLS Segment error' });
  }
});
