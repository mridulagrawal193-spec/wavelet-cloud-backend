import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { songDatabase, CloudSong } from '../services/songDatabase';
import { storageService } from '../services/storageService';
import { config } from '../config';

export const songsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // Max 50MB audio file
  },
});

/**
 * Get all songs with optional search query
 */
songsRouter.get('/', (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (query) {
    const filtered = songDatabase.search(query);
    return res.json({ songs: filtered, total: filtered.length });
  }
  const songs = songDatabase.getAll();
  res.json({ songs, total: songs.length });
});

/**
 * Get specific song details
 */
songsRouter.get('/:id', (req: Request, res: Response) => {
  const song = songDatabase.getById(req.params.id);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }
  res.json(song);
});

/**
 * Song ingestion / upload endpoint (Protected with owner secret)
 */
songsRouter.post(
  '/upload',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'artwork', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const secret = req.headers['x-owner-key'] || req.query.key;
      if (secret !== config.ownerSecret) {
        return res.status(403).json({ error: 'Unauthorized to upload tracks' });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const audioFile = files['audio']?.[0];
      const artworkFile = files['artwork']?.[0];

      if (!audioFile) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      const { title, artist, album, duration, genre, bpm, keySignature } = req.body;
      const songId = `wvlt_${Date.now()}`;
      const ext = path.extname(audioFile.originalname) || '.mp3';
      const audioFilename = `${songId}${ext}`;

      const savedAudioKey = await storageService.saveLocalFile('audio', audioFilename, audioFile.buffer);

      let savedArtworkUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';
      if (artworkFile) {
        const artExt = path.extname(artworkFile.originalname) || '.jpg';
        const artFilename = `${songId}${artExt}`;
        const savedArtKey = await storageService.saveLocalFile('artwork', artFilename, artworkFile.buffer);
        savedArtworkUrl = `/uploads/${savedArtKey}`;
      }

      const newSong: CloudSong = {
        id: songId,
        title: title || audioFile.originalname.replace(ext, ''),
        artist: artist || 'Wavelet Artist',
        album: album || 'Wavelet Cloud Originals',
        duration: Number(duration) || 180,
        artworkUrl: savedArtworkUrl,
        streamUrl: `/api/stream/${songId}`,
        genre: genre || 'Pop',
        bpm: Number(bpm) || 120,
        keySignature: keySignature || 'C Major',
        storageKey: savedAudioKey,
        downloadsCount: 0,
        playCount: 0,
        createdAt: new Date().toISOString(),
      };

      songDatabase.upsert(newSong);

      res.status(201).json({
        message: 'Song uploaded and added to Wavelet catalog successfully',
        song: newSong,
      });
    } catch (err) {
      console.error('Upload Error:', err);
      res.status(500).json({ error: 'Failed to process audio upload' });
    }
  }
);
