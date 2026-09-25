import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

/**
 * Transcodes an audio file into HLS segmented format (.m3u8 playlist and 6s .aac / .ts chunks)
 * Enables Spotify / Apple Music style adaptive audio streaming with immediate start
 */
export function transcodeAudioToHLS(
  inputFilePath: string,
  outputDir: string,
  segmentDurationSeconds: number = 6
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const playlistPath = path.join(outputDir, 'playlist.m3u8');
    const segmentPattern = path.join(outputDir, 'segment_%03d.aac');

    ffmpeg(inputFilePath)
      .outputOptions([
        '-c:a aac',
        '-b:a 256k',
        '-f hls',
        `-hls_time ${segmentDurationSeconds}`,
        '-hls_list_size 0',
        `-hls_segment_filename ${segmentPattern}`,
      ])
      .output(playlistPath)
      .on('end', () => {
        console.log(`[HLS Transcoder] Successfully transcoded ${inputFilePath} -> ${playlistPath}`);
        resolve(playlistPath);
      })
      .on('error', (err) => {
        console.error('[HLS Transcoder] Error transcoding audio:', err);
        reject(err);
      })
      .run();
  });
}
