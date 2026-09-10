const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemType: {
    type: String,
    enum: ['faq', 'question'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemModel'
  },
  itemModel: {
    type: String,
    required: true,
    enum: ['FAQ', 'Question']
  }
}, { timestamps: true });

// A user can only bookmark an item once
bookmarkSchema.index({ user: 1, itemId: 1, itemType: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
