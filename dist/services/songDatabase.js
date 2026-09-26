"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.songDatabase = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class SongDatabase {
    songs = new Map();
    dbFilePath = path_1.default.resolve('./data/songs.json');
    constructor() {
        this.loadDatabase();
    }
    loadDatabase() {
        try {
            const dir = path_1.default.dirname(this.dbFilePath);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            if (fs_1.default.existsSync(this.dbFilePath)) {
                const raw = fs_1.default.readFileSync(this.dbFilePath, 'utf8');
                const list = JSON.parse(raw);
                for (const s of list) {
                    this.songs.set(s.id, s);
                }
            }
            else {
                // Seed initial high-quality demo catalog
                this.seedInitialSongs();
            }
        }
        catch (err) {
            console.error('SongDatabase load failed:', err);
        }
    }
    seedInitialSongs() {
        const seed = [
            {
                id: 'wvlt_101',
                title: 'Starboy',
                artist: 'The Weeknd, Daft Punk',
                album: 'Starboy',
                duration: 230,
                artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop',
                streamUrl: '/api/stream/wvlt_101',
                genre: 'Synthpop',
                bpm: 186,
                keySignature: 'G Major',
                storageKey: 'audio/wvlt_101.mp3',
                downloadsCount: 1420,
                playCount: 18920,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'wvlt_102',
                title: 'Blinding Lights',
                artist: 'The Weeknd',
                album: 'After Hours',
                duration: 200,
                artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop',
                streamUrl: '/api/stream/wvlt_102',
                genre: 'Synthwave',
                bpm: 171,
                keySignature: 'F Minor',
                storageKey: 'audio/wvlt_102.mp3',
                downloadsCount: 3120,
                playCount: 45210,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'wvlt_103',
                title: 'Midnight City',
                artist: 'M83',
                album: 'Hurry Up, We\'re Dreaming',
                duration: 244,
                artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop',
                streamUrl: '/api/stream/wvlt_103',
                genre: 'Electronic',
                bpm: 105,
                keySignature: 'B Minor',
                storageKey: 'audio/wvlt_103.mp3',
                downloadsCount: 980,
                playCount: 12500,
                createdAt: new Date().toISOString(),
            }
        ];
        for (const s of seed) {
            this.songs.set(s.id, s);
        }
        this.saveDatabase();
    }
    saveDatabase() {
        try {
            const list = Array.from(this.songs.values());
            fs_1.default.writeFileSync(this.dbFilePath, JSON.stringify(list, null, 2), 'utf8');
        }
        catch (err) {
            console.error('SongDatabase save failed:', err);
        }
    }
    getAll() {
        return Array.from(this.songs.values());
    }
    getById(id) {
        return this.songs.get(id);
    }
    search(query) {
        const q = query.toLowerCase();
        return this.getAll().filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || (s.album && s.album.toLowerCase().includes(q)));
    }
    upsert(song) {
        this.songs.set(song.id, song);
        this.saveDatabase();
    }
    incrementPlayCount(id) {
        const song = this.songs.get(id);
        if (song) {
            song.playCount += 1;
            this.saveDatabase();
        }
    }
    incrementDownloadCount(id) {
        const song = this.songs.get(id);
        if (song) {
            song.downloadsCount += 1;
            this.saveDatabase();
        }
    }
}
exports.songDatabase = new SongDatabase();
