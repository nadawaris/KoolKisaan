const mongoose = require('mongoose');

const faqEditSuggestionSchema = new mongoose.Schema({
  faq: { type: mongoose.Schema.Types.ObjectId, ref: 'FAQ', required: true },
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  proposedTitle: { type: String, required: true },
  proposedAnswer: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminFeedback: { type: String }
}, { timestamps: true });

const FAQEditSuggestion = mongoose.model('FAQEditSuggestion', faqEditSuggestionSchema);
module.exports = FAQEditSuggestion;
