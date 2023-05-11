const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

const watchListSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    connection: { type: Schema.Types.ObjectId, ref: 'Connection' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WatchList', watchListSchema);
