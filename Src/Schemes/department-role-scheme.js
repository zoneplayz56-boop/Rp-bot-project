const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    guildID: {
        type: String,
        required: true,
        unique: true,
    },
    departments: {
        police: { type: String, default: null },
        fire: { type: String, default: null },
        ems: { type: String, default: null },
        civilian: { type: String, default: null },
        dispatch: { type: String, default: null },
    },
    channels: {
        dispatch: { type: String, default: null },
    },
});

module.exports = mongoose.model('DepartmentRoles', configSchema);