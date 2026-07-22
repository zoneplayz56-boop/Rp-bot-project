const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, 
  totalShifts: { type: Number, default: 0 },              
  totalMinutes: { type: Number, default: 0 },             
  lastShiftCompleted: { type: Date, default: null }
});

module.exports = mongoose.model('Shiftlog', ShiftSchema);
