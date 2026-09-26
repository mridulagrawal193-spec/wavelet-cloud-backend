"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../config");
class StorageService {
    s3Client = null;
    constructor() {
        if (config_1.config.storage.mode === 's3' && config_1.config.storage.s3.endpoint) {
            this.s3Client = new client_s3_1.S3Client({
                region: config_1.config.storage.s3.region,
                endpoint: config_1.config.storage.s3.endpoint,
                credentials: {
                    accessKeyId: config_1.config.storage.s3.accessKeyId,
                    secretAccessKey: config_1.config.storage.s3.secretAccessKey,
                },
            });
        }
        else {
            if (!fs_1.default.existsSync(config_1.config.storage.localDir)) {
                fs_1.default.mkdirSync(config_1.config.storage.localDir, { recursive: true });
                fs_1.default.mkdirSync(path_1.default.join(config_1.config.storage.localDir, 'audio'), { recursive: true });
                fs_1.default.mkdirSync(path_1.default.join(config_1.config.storage.localDir, 'hls'), { recursive: true });
                fs_1.default.mkdirSync(path_1.default.join(config_1.config.storage.localDir, 'artwork'), { recursive: true });
            }
        }
    }
    async getFileStream(filePathKey, range) {
        if (config_1.config.storage.mode === 's3' && this.s3Client) {
            try {
                const headCmd = new client_s3_1.HeadObjectCommand({
                    Bucket: config_1.config.storage.s3.bucket,
                    Key: filePathKey,
                });
                const head = await this.s3Client.send(headCmd);
                const totalSize = head.ContentLength || 0;
                const contentType = head.ContentType || 'audio/mpeg';
                const rangeHeader = range ? `bytes=${range.start}-${range.end}` : undefined;
                const getCmd = new client_s3_1.GetObjectCommand({
                    Bucket: config_1.config.storage.s3.bucket,
                    Key: filePathKey,
                    Range: rangeHeader,
                });
                const res = await this.s3Client.send(getCmd);
                if (!res.Body)
                    return null;
                const contentLength = range ? range.end - range.start + 1 : totalSize;
                return {
                    stream: res.Body,
                    contentLength,
                    totalSize,
                    contentType,
                };
            }
            catch (err) {
                console.error('S3 Fetch Error:', err);
                return null;
            }
        }
        else {
            const fullPath = path_1.default.resolve(config_1.config.storage.localDir, filePathKey);
            if (!fs_1.default.existsSync(fullPath))
                return null;
            const stat = fs_1.default.statSync(fullPath);
            const totalSize = stat.size;
            const ext = path_1.default.extname(fullPath).toLowerCase();
            const contentType = ext === '.m3u8' ? 'application/vnd.apple.mpegurl' :
                ext === '.ts' ? 'video/MP2T' :
                    ext === '.aac' ? 'audio/aac' :
                        ext === '.m4a' ? 'audio/mp4' :
                            ext === '.flac' ? 'audio/flac' : 'audio/mpeg';
            if (range) {
                const stream = fs_1.default.createReadStream(fullPath, { start: range.start, end: range.end });
                return {
                    stream,
                    contentLength: range.end - range.start + 1,
                    totalSize,
                    contentType,
                };
            }
            else {
                const stream = fs_1.default.createReadStream(fullPath);
                return {
                    stream,
                    contentLength: totalSize,
                    totalSize,
                    contentType,
                };
            }
        }
    }
    async saveLocalFile(subDir, filename, buffer) {
        const targetDir = path_1.default.join(config_1.config.storage.localDir, subDir);
        if (!fs_1.default.existsSync(targetDir)) {
            fs_1.default.mkdirSync(targetDir, { recursive: true });
        }
        const targetPath = path_1.default.join(targetDir, filename);
        await fs_1.default.promises.writeFile(targetPath, buffer);
        return path_1.default.join(subDir, filename).replace(/\\/g, '/');
    }
    getLocalPath(relativeKey) {
        return path_1.default.resolve(config_1.config.storage.localDir, relativeKey);
    }
}
exports.storageService = new StorageService();
