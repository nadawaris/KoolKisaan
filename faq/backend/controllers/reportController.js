const Report = require('../models/Report');

const createReport = async (req, res) => {
  try {
    const { itemId, itemType, reason } = req.body;
    
    // Map itemType to Mongoose model name
    const modelMap = {
      'faq': 'FAQ',
      'question': 'Question',
      'answer': 'Answer',
      'comment': 'Comment'
    };
    
    if (!modelMap[itemType]) {
      return res.status(400).json({ message: 'Invalid item type' });
    }

    const report = new Report({
      reporter: req.user._id,
      itemId,
      itemType,
      itemModel: modelMap[itemType],
      reason
    });
    
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('reporter', 'username')
      .populate({ path: 'itemId' })
      .sort('-createdAt');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    report.status = req.body.status || 'resolved'; // resolved or dismissed
    await report.save();
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReport, getReports, resolveReport };
