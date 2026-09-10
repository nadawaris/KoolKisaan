const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect } = require('../middleware/auth');

// Initialize Cloudinary if keys exist
let upload;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'faq_platform',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
    }
  });

  upload = multer({ storage });
} else {
  // Mock upload for development without keys
  upload = multer({ storage: multer.memoryStorage() });
}

router.post('/', protect, upload.single('image'), (req, res) => {
  if (req.file && req.file.path) {
    // Cloudinary upload successful
    res.json({ url: req.file.path });
  } else if (req.file && req.file.buffer) {
    // Mock upload fallback
    res.json({ url: 'https://via.placeholder.com/800x400.png?text=Mock+Cloudinary+Upload' });
  } else {
    res.status(400).json({ message: 'No file uploaded' });
  }
});

module.exports = router;
