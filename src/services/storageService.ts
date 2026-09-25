import fs from 'fs';
import path from 'path';
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

class StorageService {
  private s3Client: S3Client | null = null;

  constructor() {
    if (config.storage.mode === 's3' && config.storage.s3.endpoint) {
      this.s3Client = new S3Client({
        region: config.storage.s3.region,
        endpoint: config.storage.s3.endpoint,
        credentials: {
          accessKeyId: config.storage.s3.accessKeyId,
          secretAccessKey: config.storage.s3.secretAccessKey,
        },
      });
    } else {
      if (!fs.existsSync(config.storage.localDir)) {
        fs.mkdirSync(config.storage.localDir, { recursive: true });
        fs.mkdirSync(path.join(config.storage.localDir, 'audio'), { recursive: true });
        fs.mkdirSync(path.join(config.storage.localDir, 'hls'), { recursive: true });
        fs.mkdirSync(path.join(config.storage.localDir, 'artwork'), { recursive: true });
      }
    }
  }

  public async getFileStream(
    filePathKey: string,
    range?: { start: number; end: number }
  ): Promise<{ stream: NodeJS.ReadableStream; contentLength: number; totalSize: number; contentType: string } | null> {
    if (config.storage.mode === 's3' && this.s3Client) {
      try {
        const headCmd = new HeadObjectCommand({
          Bucket: config.storage.s3.bucket,
          Key: filePathKey,
        });
        const head = await this.s3Client.send(headCmd);
        const totalSize = head.ContentLength || 0;
        const contentType = head.ContentType || 'audio/mpeg';

        const rangeHeader = range ? `bytes=${range.start}-${range.end}` : undefined;
        const getCmd = new GetObjectCommand({
          Bucket: config.storage.s3.bucket,
          Key: filePathKey,
          Range: rangeHeader,
        });
        const res = await this.s3Client.send(getCmd);
        if (!res.Body) return null;

        const contentLength = range ? range.end - range.start + 1 : totalSize;
        return {
          stream: res.Body as NodeJS.ReadableStream,
          contentLength,
          totalSize,
          contentType,
        };
      } catch (err) {
        console.error('S3 Fetch Error:', err);
        return null;
      }
    } else {
      const fullPath = path.resolve(config.storage.localDir, filePathKey);
      if (!fs.existsSync(fullPath)) return null;

      const stat = fs.statSync(fullPath);
      const totalSize = stat.size;
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = ext === '.m3u8' ? 'application/vnd.apple.mpegurl' :
                          ext === '.ts' ? 'video/MP2T' :
                          ext === '.aac' ? 'audio/aac' :
                          ext === '.m4a' ? 'audio/mp4' :
                          ext === '.flac' ? 'audio/flac' : 'audio/mpeg';

      if (range) {
        const stream = fs.createReadStream(fullPath, { start: range.start, end: range.end });
        return {
          stream,
          contentLength: range.end - range.start + 1,
          totalSize,
          contentType,
        };
      } else {
        const stream = fs.createReadStream(fullPath);
        return {
          stream,
          contentLength: totalSize,
          totalSize,
          contentType,
        };
      }
    }
  }

  public async saveLocalFile(subDir: string, filename: string, buffer: Buffer): Promise<string> {
    const targetDir = path.join(config.storage.localDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetPath = path.join(targetDir, filename);
    await fs.promises.writeFile(targetPath, buffer);
    return path.join(subDir, filename).replace(/\\/g, '/');
  }

  public getLocalPath(relativeKey: string): string {
    return path.resolve(config.storage.localDir, relativeKey);
  }
}

export const storageService = new StorageService();
