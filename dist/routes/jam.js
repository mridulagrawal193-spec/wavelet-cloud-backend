"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jamRouter = void 0;
const express_1 = require("express");
exports.jamRouter = (0, express_1.Router)();
// In-memory active Jam Rooms store
const activeRooms = new Map();
// Auto-cleanup stale rooms (inactive for more than 2 hours)
setInterval(() => {
    const now = Date.now();
    for (const [code, room] of activeRooms.entries()) {
        if (now - room.lastUpdated > 2 * 60 * 60 * 1000) {
            activeRooms.delete(code);
        }
    }
}, 60000);
/**
 * Create a new Jam room
 */
exports.jamRouter.post('/create', (req, res) => {
    const { hostId, hostName, avatar, track, positionMs, isPlaying, roomCode: requestedCode } = req.body;
    // Use requested 6-digit code from client if present, else generate random 6-digit room code
    let roomCode = requestedCode && String(requestedCode).trim().length >= 4
        ? String(requestedCode).trim()
        : Math.floor(100000 + Math.random() * 900000).toString();
    while (!requestedCode && activeRooms.has(roomCode)) {
        roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    }
    const now = Date.now();
    const room = {
        roomCode,
        hostId: hostId || 'host_' + Math.random().toString(36).substring(2, 7),
        hostName: hostName || 'Wavelet Host',
        createdAt: now,
        lastUpdated: now,
        participants: [
            {
                id: hostId,
                name: hostName || 'Host',
                avatar: avatar || '🎧',
                isHost: true,
                lastActive: now,
            }
        ],
        currentTrack: track || null,
        positionMs: Number(positionMs) || 0,
        isPlaying: Boolean(isPlaying),
        liveReactions: [],
        sharedQueue: track ? [track] : [],
    };
    activeRooms.set(roomCode, room);
    res.status(201).json({
        success: true,
        roomCode,
        room,
    });
});
/**
 * Join an existing Jam room by code
 */
exports.jamRouter.post('/join', (req, res) => {
    const { roomCode, participantId, participantName, avatar } = req.body;
    const cleanCode = String(roomCode || '').trim();
    const room = activeRooms.get(cleanCode);
    if (!room) {
        return res.status(404).json({
            success: false,
            error: `Jam room #${cleanCode} not found. Please verify the 6-digit code.`,
        });
    }
    const now = Date.now();
    const existingIdx = room.participants.findIndex((p) => p.id === participantId);
    if (existingIdx >= 0) {
        room.participants[existingIdx].lastActive = now;
        room.participants[existingIdx].name = participantName || room.participants[existingIdx].name;
    }
    else {
        room.participants.push({
            id: participantId,
            name: participantName || `Friend #${room.participants.length + 1}`,
            avatar: avatar || '🎵',
            isHost: false,
            lastActive: now,
        });
    }
    room.lastUpdated = now;
    res.json({
        success: true,
        room,
    });
});
/**
 * Poll room state in real-time
 */
exports.jamRouter.get('/room/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const room = activeRooms.get(String(roomCode).trim());
    if (!room) {
        return res.status(404).json({ success: false, error: 'Room expired or not found' });
    }
    res.json({
        success: true,
        room,
    });
});
/**
 * Host syncs playback position, current track, or pause/play state
 */
exports.jamRouter.post('/sync', (req, res) => {
    const { roomCode, hostId, track, positionMs, isPlaying, reaction } = req.body;
    const room = activeRooms.get(String(roomCode).trim());
    if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found' });
    }
    const now = Date.now();
    room.lastUpdated = now;
    if (track !== undefined) {
        room.currentTrack = track;
    }
    if (positionMs !== undefined) {
        room.positionMs = Number(positionMs);
    }
    if (isPlaying !== undefined) {
        room.isPlaying = Boolean(isPlaying);
    }
    if (reaction) {
        room.liveReactions.unshift({
            id: 'rx_' + now,
            emoji: reaction.emoji || '🔥',
            senderName: reaction.senderName || 'Listener',
            timestamp: now,
        });
        // Keep max 15 live reactions
        if (room.liveReactions.length > 15) {
            room.liveReactions.pop();
        }
    }
    res.json({ success: true, room });
});
/**
 * Leave Jam room
 */
exports.jamRouter.post('/leave', (req, res) => {
    const { roomCode, participantId } = req.body;
    const room = activeRooms.get(String(roomCode).trim());
    if (room) {
        room.participants = room.participants.filter((p) => p.id !== participantId);
        if (room.participants.length === 0) {
            activeRooms.delete(String(roomCode).trim());
        }
    }
    res.json({ success: true });
});
