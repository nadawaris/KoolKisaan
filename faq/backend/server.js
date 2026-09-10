const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const seedDatabase = require('./seedData');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Users join a personal room based on their User ID to receive personal notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their personal notification room.`);
  });

  // Users join a specific thread/question room to see live typing and new answers
  socket.on('join_thread', (threadId) => {
    socket.join(`thread_${threadId}`);
    console.log(`Socket joined thread room: thread_${threadId}`);
  });

  // Broadcast typing indicator to everyone else in the thread
  socket.on('typing', ({ threadId, username }) => {
    socket.to(`thread_${threadId}`).emit('user_typing', { username });
  });

  socket.on('stop_typing', ({ threadId, username }) => {
    socket.to(`thread_${threadId}`).emit('user_stop_typing', { username });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Attach io to the request object so routes can broadcast events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security Middleware
app.use(helmet());
// app.use(mongoSanitize()); // Disabled due to Express 5 compatibility crash

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000 // limit each IP to 10000 requests per windowMs during local dev
});
app.use('/api/', apiLimiter);

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Session & Passport Configuration
app.use(session({ secret: 'yaksha_secret_mern', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: "http://localhost:5000/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, cb) => {
    const User = require('./models/User');
    try {
      // Find user by Google ID or Email
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        // Create new user if they don't exist
        const isSuperAdmin = profile.emails[0].value === 'abhishekyadav270705@gmail.com';
        const dummyPassword = 'google_oauth_dummy_password_' + Date.now();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(dummyPassword, salt);
        
        user = await User.create({
          username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
          email: profile.emails[0].value,
          password: hashedPassword,
          role: isSuperAdmin ? 'admin' : 'user',
          needsOnboarding: true
        });
      } else {
        // If user exists but is abhishekyadav270705@gmail.com, upgrade them to admin if not already
        if (user.email === 'abhishekyadav270705@gmail.com' && user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
        }
      }
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
const authRoutes = require('./routes/authRoutes');
const faqRoutes = require('./routes/faqRoutes');
const qaRoutes = require('./routes/qaRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/leaderboard', async (req, res) => {
  const User = require('./models/User');
  try {
    const users = await User.find({ role: 'user' }).sort({ reputation: -1 }).limit(10);
    res.json(users);
  } catch(err) { res.status(500).json(err); }
});

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the FAQ Platform API (MERN Migration)' });
});

// Database Connection via Memory Server with local persistence
const path = require('path');
const startServer = async () => {
  try {
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath: path.join(__dirname, 'mongo-data'),
        storageEngine: 'wiredTiger'
      }
    });
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri);
    console.log('✅ MongoDB Memory Server Connected (Persistent)');
    
    await seedDatabase();

    server.listen(PORT, () => console.log(`🚀 Server & WebSockets running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
  }
};

startServer();
