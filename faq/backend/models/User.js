const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'moderator', 'admin', 'legacy_account'], default: 'user' },
  needsOnboarding: { type: Boolean, default: false },
  bio: { type: String, default: '' },
  avatar: { type: String, default: null },
  reputation: { type: Number, default: 0 },
  isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.virtual('badge').get(function() {
  if (this.reputation >= 500) return { name: 'Diamond Guru', icon: 'bi-gem', color: 'text-info' };
  if (this.reputation >= 300) return { name: 'Platinum Guide', icon: 'bi-star-fill', color: 'text-primary' };
  if (this.reputation >= 150) return { name: 'Gold Contributor', icon: 'bi-award-fill', color: 'text-warning' };
  if (this.reputation >= 50) return { name: 'Silver Helper', icon: 'bi-shield-fill-check', color: 'text-secondary' };
  return null;
});

module.exports = mongoose.model('User', userSchema);
