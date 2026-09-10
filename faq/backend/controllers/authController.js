const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const sendVerificationEmail = async (email, username) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: { user: process.env.EMAIL_USER || 'dummy', pass: process.env.EMAIL_PASS || 'dummy' }
    });
    await transporter.sendMail({
      from: '"Yaksha Auth" <noreply@yaksha.com>',
      to: email,
      subject: "Welcome to Yaksha - Verify Your Email",
      html: `<h3>Hi ${username},</h3><p>Please click here to verify your email.</p>`
    });
  } catch (err) {
    console.error("Email Error:", err);
  }
};

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ username, email, password: hashedPassword });
    if (user) {
      // Trigger async email verification
      sendVerificationEmail(user.email, user.username);
      
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { Question, Answer } = require('../models/QA');
const { FAQ } = require('../models/FAQ');

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      const questionsCount = await Question.countDocuments({ author: user._id });
      const answersCount = await Answer.countDocuments({ author: user._id });
      const faqsCount = await FAQ.countDocuments({ author: user._id });
      
      const userObj = user.toObject();
      // Attach real database stats
      userObj.stats = {
        questions: questionsCount,
        answers: answersCount,
        faqs: faqsCount,
        upvotesReceived: user.reputation || 0
      };
      
      // Echo back the token so that frontend components using `user.token` don't break on refresh
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        userObj.token = req.headers.authorization.split(' ')[1];
      }
      
      res.json(userObj);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username && username.trim() !== user.username) {
      if (username.trim().length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
      }
      const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username.trim().toLowerCase();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    user.needsOnboarding = false;
    await user.save();

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio,
      avatar: user.avatar,
      needsOnboarding: user.needsOnboarding,
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateProfile };
