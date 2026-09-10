const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'bi-book' },
});
const Category = mongoose.model('Category', categorySchema);

const faqSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'pending', 'published', 'rejected'], default: 'pending' },
  tags: [{ type: String }],
  attachment: { type: String, default: null },
  image: { type: String, default: null },
  viewCount: { type: Number, default: 0 },
  upvoteCount: { type: Number, default: 0 },
  downvoteCount: { type: Number, default: 0 },
  version: { type: Number, default: 1 },
  publishedAt: { type: Date, default: null },
  embedding: { type: [Number], default: [] },
}, { timestamps: true });

faqSchema.virtual('score').get(function() {
  return this.upvoteCount - this.downvoteCount;
});

const FAQ = mongoose.model('FAQ', faqSchema);

module.exports = { Category, FAQ };
