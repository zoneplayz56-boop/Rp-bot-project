const mongoose = require('mongoose');
const departmentChannelConfigSchema = new mongoose.Schema({
    configType: {
        type: String,
        required: true,
        unique: true,
    },
    channelId: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('DepartmentChannelConfig', departmentChannelConfigSchema);