const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  count: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

module.exports = mongoose.model('SearchLog', searchLogSchema);
