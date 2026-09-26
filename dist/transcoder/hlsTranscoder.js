"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcodeAudioToHLS = transcodeAudioToHLS;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Transcodes an audio file into HLS segmented format (.m3u8 playlist and 6s .aac / .ts chunks)
 * Enables Spotify / Apple Music style adaptive audio streaming with immediate start
 */
function transcodeAudioToHLS(inputFilePath, outputDir, segmentDurationSeconds = 6) {
    return new Promise((resolve, reject) => {
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const playlistPath = path_1.default.join(outputDir, 'playlist.m3u8');
        const segmentPattern = path_1.default.join(outputDir, 'segment_%03d.aac');
        (0, fluent_ffmpeg_1.default)(inputFilePath)
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
