import fs from 'fs';
import path from 'path';

export interface CloudSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  artworkUrl: string;
  streamUrl: string;
  hlsUrl?: string;
  genre?: string;
  bpm?: number;
  keySignature?: string;
  storageKey?: string;
  downloadsCount: number;
  playCount: number;
  createdAt: string;
}

class SongDatabase {
  private songs: Map<string, CloudSong> = new Map();
  private dbFilePath: string = path.resolve('./data/songs.json');

  constructor() {
    this.loadDatabase();
  }

  private loadDatabase() {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        const list: CloudSong[] = JSON.parse(raw);
        for (const s of list) {
          this.songs.set(s.id, s);
        }
      } else {
        // Seed initial high-quality demo catalog
        this.seedInitialSongs();
      }
    } catch (err) {
      console.error('SongDatabase load failed:', err);
    }
  }

  private seedInitialSongs() {
    const seed: CloudSong[] = [
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

  private saveDatabase() {
    try {
      const list = Array.from(this.songs.values());
      fs.writeFileSync(this.dbFilePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('SongDatabase save failed:', err);
    }
  }

  public getAll(): CloudSong[] {
    return Array.from(this.songs.values());
  }

  public getById(id: string): CloudSong | undefined {
    return this.songs.get(id);
  }

  public search(query: string): CloudSong[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || (s.album && s.album.toLowerCase().includes(q))
    );
  }

  public upsert(song: CloudSong) {
    this.songs.set(song.id, song);
    this.saveDatabase();
  }

  public incrementPlayCount(id: string) {
    const song = this.songs.get(id);
    if (song) {
      song.playCount += 1;
      this.saveDatabase();
    }
  }

  public incrementDownloadCount(id: string) {
    const song = this.songs.get(id);
    if (song) {
      song.downloadsCount += 1;
      this.saveDatabase();
    }
  }
}

export const songDatabase = new SongDatabase();
