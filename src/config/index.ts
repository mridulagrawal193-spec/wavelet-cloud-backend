import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  storage: {
    mode: (process.env.STORAGE_MODE || 'local') as 'local' | 's3',
    localDir: path.resolve(process.env.LOCAL_STORAGE_DIR || './uploads'),
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
