const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    guildID: {
        type: String,
        required: true,
    },
    callerID: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'Open',
    },
    claimedBy: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Call', callSchema);