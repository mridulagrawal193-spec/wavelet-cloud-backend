"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.songsRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const songDatabase_1 = require("../services/songDatabase");
const storageService_1 = require("../services/storageService");
const config_1 = require("../config");
exports.songsRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // Max 50MB audio file
    },
});
/**
 * Get all songs with optional search query
 */
exports.songsRouter.get('/', (req, res) => {
    const query = req.query.q;
    if (query) {
        const filtered = songDatabase_1.songDatabase.search(query);
        return res.json({ songs: filtered, total: filtered.length });
    }
    const songs = songDatabase_1.songDatabase.getAll();
    res.json({ songs, total: songs.length });
});
/**
 * Get specific song details
 */
exports.songsRouter.get('/:id', (req, res) => {
    const song = songDatabase_1.songDatabase.getById(req.params.id);
    if (!song) {
        return res.status(404).json({ error: 'Song not found' });
    }
    res.json(song);
});
/**
 * Song ingestion / upload endpoint (Protected with owner secret)
 */
exports.songsRouter.post('/upload', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'artwork', maxCount: 1 },
]), async (req, res) => {
    try {
        const secret = req.headers['x-owner-key'] || req.query.key;
        if (secret !== config_1.config.ownerSecret) {
            return res.status(403).json({ error: 'Unauthorized to upload tracks' });
        }
        const files = req.files;
        const audioFile = files['audio']?.[0];
        const artworkFile = files['artwork']?.[0];
        if (!audioFile) {
            return res.status(400).json({ error: 'Audio file is required' });
        }
        const { title, artist, album, duration, genre, bpm, keySignature } = req.body;
        const songId = `wvlt_${Date.now()}`;
        const ext = path_1.default.extname(audioFile.originalname) || '.mp3';
        const audioFilename = `${songId}${ext}`;
        const savedAudioKey = await storageService_1.storageService.saveLocalFile('audio', audioFilename, audioFile.buffer);
        let savedArtworkUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';
        if (artworkFile) {
            const artExt = path_1.default.extname(artworkFile.originalname) || '.jpg';
            const artFilename = `${songId}${artExt}`;
            const savedArtKey = await storageService_1.storageService.saveLocalFile('artwork', artFilename, artworkFile.buffer);
            savedArtworkUrl = `/uploads/${savedArtKey}`;
        }
        const newSong = {
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
        songDatabase_1.songDatabase.upsert(newSong);
        res.status(201).json({
            message: 'Song uploaded and added to Wavelet catalog successfully',
            song: newSong,
        });
    }
    catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Failed to process audio upload' });
    }
});
