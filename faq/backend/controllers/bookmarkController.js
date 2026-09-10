const Bookmark = require('../models/Bookmark');
const { FAQ } = require('../models/FAQ');
const { Question } = require('../models/QA');

const toggleBookmark = async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    const userId = req.user.id;

    if (!itemId || !['faq', 'question'].includes(itemType)) {
      return res.status(400).json({ message: 'Invalid item data' });
    }

    const itemModel = itemType === 'faq' ? 'FAQ' : 'Question';
    
    // Check if bookmark exists
    const existing = await Bookmark.findOne({ user: userId, itemId, itemType });
    
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ message: 'Bookmark removed', bookmarked: false });
    } else {
      await Bookmark.create({
        user: userId,
        itemType,
        itemId,
        itemModel
      });
      return res.status(201).json({ message: 'Bookmark added', bookmarked: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id })
      .populate({ path: 'itemId' })
      .sort('-createdAt');
    
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { toggleBookmark, getBookmarks };
