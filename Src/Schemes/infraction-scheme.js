const mongoose = require('mongoose');
const Counter = require('./counter-scheme.js');

const InfractionSchema = new mongoose.Schema({
  infractionId: { type: String, unique: true },        
  targetId: { type: String, required: true },       
  moderatorId: { type: String, required: true },      
  reason: { type: String, default: 'No reason provided' }, 
  previousRankId: { type: String, default: null },  
  newRankId: { type: String, default: null },        
  createdAt: { type: Date, default: Date.now },              
});

InfractionSchema.pre('save', async function () {
  const doc = this;
  if (!doc.infractionId) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'infractionId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const paddedNumber = String(counter.seq).padStart(2, '0');
    doc.infractionId = `infraction-case-${paddedNumber}`;
  }
});

module.exports = mongoose.model('Infractionlog', InfractionSchema);