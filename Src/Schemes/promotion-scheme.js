const mongoose = require('mongoose');
const Counter = require('./counter-scheme.js');

const PromotionSchema = new mongoose.Schema({
  promotionId: { type: String, unique: true },        
  targetId: { type: String, required: true },       
  moderatorId: { type: String, required: true },       
  reason: { type: String, default: 'No reason provided'},
  previousRankId: { type: String, default: null },     
  newRankId: { type: String, default: null },     
  createdAt: { type: Date, default: Date.now },              
});

PromotionSchema.pre('save', async function () {
  const doc = this;
  if (!doc.promotionId) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'promotionId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const paddedNumber = String(counter.seq).padStart(2, '0');
    doc.promotionId = `promotion-case-${paddedNumber}`;
  }
});

module.exports = mongoose.model('Promotionlog', PromotionSchema);