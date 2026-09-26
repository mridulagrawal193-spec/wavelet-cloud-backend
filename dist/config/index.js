"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    storage: {
        mode: (process.env.STORAGE_MODE || 'local'),
        localDir: path_1.default.resolve(process.env.LOCAL_STORAGE_DIR || './uploads'),
        s3: {
            endpoint: process.env.S3_ENDPOINT || '',
            region: process.env.S3_REGION || 'auto',
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
            bucket: process.env.S3_BUCKET_NAME || 'wavelet-music',
            cdnUrl: process.env.S3_PUBLIC_CDN_URL || '',
        },
    },
    ownerSecret: process.env.OWNER_API_SECRET || 'wavelet_master_owner_key_2026',
    lyrics: {
        lrclibApiUrl: process.env.LRCLIB_API_URL || 'https://lrclib.net/api',
        lyricFindApiKey: process.env.LYRICFIND_API_KEY || '',
    },
};
