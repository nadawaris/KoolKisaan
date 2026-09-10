const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [{ type: String }],
  viewCount: { type: Number, default: 0 },
  viewers: [{ type: String }],
  isAnswered: { type: Boolean, default: false },
  upvoteCount: { type: Number, default: 0 },
  downvoteCount: { type: Number, default: 0 },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['draft', 'pending', 'published', 'rejected'], default: 'published' },
}, { timestamps: true });

questionSchema.virtual('score').get(function() { return this.upvoteCount - this.downvoteCount; });

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: function() { return !this.isAI; } },
  isAI: { type: Boolean, default: false },
  body: { type: String, required: true },
  isAccepted: { type: Boolean, default: false },
  upvoteCount: { type: Number, default: 0 },
  downvoteCount: { type: Number, default: 0 },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['draft', 'pending', 'published', 'rejected'], default: 'published' },
}, { timestamps: true });

answerSchema.virtual('score').get(function() { return this.upvoteCount - this.downvoteCount; });

const commentSchema = new mongoose.Schema({
  answer: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  upvoteCount: { type: Number, default: 0 },
  downvoteCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = {
  Question: mongoose.model('Question', questionSchema),
  Answer: mongoose.model('Answer', answerSchema),
  Comment: mongoose.model('Comment', commentSchema)
};
