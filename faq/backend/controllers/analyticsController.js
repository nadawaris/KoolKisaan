const { FAQ } = require('../models/FAQ');
const { Question, Answer } = require('../models/QA');
const SearchLog = require('../models/SearchLog');
const User = require('../models/User');

const getDashboardData = async (req, res) => {
  try {
    const totalFaqs = await FAQ.countDocuments({ status: 'published' });
    const totalQuestions = await Question.countDocuments();
    
    // Unanswered questions
    const unanswered = await Question.find({ isAnswered: false })
      .select('title createdAt')
      .sort('-createdAt')
      .limit(5);
      
    // Most viewed FAQs
    const mostViewed = await FAQ.find({ status: 'published' })
      .select('title slug viewCount')
      .sort('-viewCount')
      .limit(5);
      
    // Top search keywords
    const topSearches = await SearchLog.find()
      .sort('-count')
      .limit(5);
      
    // Active contributors (users with most answers)
    // Aggregation pipeline to group by author in Answer collection
    const activeContributors = await Answer.aggregate([
      { $group: { _id: '$author', answerCount: { $sum: 1 } } },
      { $sort: { answerCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 1, answerCount: 1, username: '$user.username' } }
    ]);

    // Trending Tags
    const tagsAggregation = await Question.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const trendingTags = tagsAggregation.map(t => ({ tag: t._id, count: t.count }));

    res.json({
      totalFaqs,
      totalQuestions,
      unanswered,
      mostViewed,
      topSearches,
      activeContributors,
      trendingTags
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim() === '') return res.status(200).json({});
    
    const term = query.toLowerCase().trim();
    await SearchLog.findOneAndUpdate(
      { query: term },
      { $inc: { count: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardData, logSearch };
