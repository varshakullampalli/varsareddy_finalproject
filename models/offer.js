const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema(
  {
    connectionWithId: { type: String, required: [true, 'Title is required'] },
    connectionWithUser: { type: String },
    connectingId: { type: String, required: [true, 'Title is required'] },
    connectingUser: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
