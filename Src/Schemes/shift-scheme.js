const mongoose = require('mongoose');

// Persistent historic stats & current weekly leaderboard tracking
const userShiftStatsSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    totalDuration: { type: Number, default: 0 }, // global time in milliseconds
    totalShifts: { type: Number, default: 0 },
    currentWaveDuration: { type: Number, default: 0 }, // weekly wave time in ms
    currentWaveShifts: { type: Number, default: 0 }
});

// Currently active session tracking
const activeShiftSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    startTime: { type: Date, required: true },
    breakStartTime: { type: Date, default: null },
    totalBreakTime: { type: Number, default: 0 } // accumulated break time in ms
});

module.exports = {
    UserShiftStats: mongoose.model('UserShiftStats', userShiftStatsSchema),
    ActiveShift: mongoose.model('ActiveShift', activeShiftSchema)
};