const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }),
  (req, res) => {
    // On success, generate JWT and redirect to React frontend
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
    res.redirect(`http://localhost:3000/login?token=${token}`);
  }
);

module.exports = router;
