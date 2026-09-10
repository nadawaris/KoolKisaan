const { FAQ, Category } = require('../models/FAQ');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateEmbedding, cosineSimilarity } = require('../utils/embeddings');

const getPendingFAQs = async (req, res) => {
  try {
    const pending = await FAQ.find({ status: 'pending' }).populate('author', 'username');
    res.json(pending);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'faqs',
          localField: '_id',
          foreignField: 'category',
          as: 'faqs'
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          icon: 1,
          questionCount: { $size: '$faqs' }
        }
      }
    ]);
    res.json(categories);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getFAQs = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    let categoryFilter = {};
    if (req.query.categorySlug) {
      const category = await Category.findOne({ slug: req.query.categorySlug });
      if (category) {
        categoryFilter = { category: category._id };
      } else {
        return res.json({ faqs: [], page: 1, pages: 1 });
      }
    }

    if (req.query.keyword) {
      // SEMANTIC VECTOR SEARCH
      const queryEmbedding = await generateEmbedding(req.query.keyword);
      
      // Handle empty query embeddings (API failure)
      if (!queryEmbedding || queryEmbedding.length === 0) {
         return res.json({ faqs: [], page: 1, pages: 1 });
      }
      
      // Fetch ONLY embeddings and IDs to save memory and avoid full population before ranking
      const allFaqsLean = await FAQ.find({ ...categoryFilter, status: 'published' })
        .select('embedding _id')
        .lean();

      // Calculate cosine similarity for each FAQ
      const scoredFaqs = allFaqsLean.map(faq => {
        const similarity = cosineSimilarity(queryEmbedding, faq.embedding);
        return { _id: faq._id, similarity };
      });

      // Filter out low relevance and sort by descending similarity
      const threshold = 0.55; 
      const filteredFaqs = scoredFaqs.filter(sf => sf.similarity >= threshold);
      filteredFaqs.sort((a, b) => b.similarity - a.similarity);
      
      // Paginate the IDs first
      const count = filteredFaqs.length;
      const paginatedIds = filteredFaqs.slice(pageSize * (page - 1), pageSize * page).map(sf => sf._id);

      // Fetch the full populated documents ONLY for the paginated subset
      const paginatedFaqsUnsorted = await FAQ.find({ _id: { $in: paginatedIds } })
        .populate('category', 'name slug')
        .populate('author', 'username');

      // Restore the similarity sort order
      const paginatedFaqs = paginatedIds.map(id => 
        paginatedFaqsUnsorted.find(faq => faq._id.toString() === id.toString())
      ).filter(Boolean);

      return res.json({ faqs: paginatedFaqs, page, pages: Math.ceil(count / pageSize) });
    }

    // Standard fallback when no keyword is provided
    const count = await FAQ.countDocuments({ ...categoryFilter, status: 'published' });
    const faqs = await FAQ.find({ ...categoryFilter, status: 'published' })
      .populate('category', 'name slug')
      .populate('author', 'username')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort('-createdAt');

    res.json({ faqs, page, pages: Math.ceil(count / pageSize) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({ author: req.user._id })
      .populate('category', 'name')
      .sort('-createdAt');
    res.json(faqs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getFAQBySlug = async (req, res) => {
  try {
    const faq = await FAQ.findOne({ slug: req.params.slug })
      .populate('category')
      .populate('author', 'username role');
    if (faq) { res.json(faq); } else { res.status(404).json({ message: 'FAQ not found' }); }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createFAQ = async (req, res) => {
  try {
    const { title, slug, question, answer, category } = req.body;

    // AI-Powered Automated Content Moderation
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Analyze the following FAQ submission for abusive, toxic, or sexual language. Answer with exactly "SAFE" or "TOXIC".\nTitle: ${title}\nQuestion: ${question}\nAnswer: ${answer}`;
      const result = await model.generateContent(prompt);
      const moderationResult = result.response.text().trim();
      
      if (moderationResult.toUpperCase().includes('TOXIC')) {
        return res.status(400).json({ message: 'Content rejected by automated moderation: Toxic language detected.' });
      }
    } catch (err) {
      console.error("Gemini Moderation Error:", err.message);
    }

    // Generate Embedding
    const embeddingText = `${title}\n${question}\n${answer}`;
    const embedding = await generateEmbedding(embeddingText);

    const faq = new FAQ({ title, slug, question, answer, category, author: req.user._id, embedding });
    const createdFAQ = await faq.save();
    res.status(201).json(createdFAQ);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const updateFAQStatus = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    faq.status = req.body.status; // 'published' or 'rejected'
    await faq.save();
    res.json(faq);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const voteFAQ = async (req, res) => {
  try {
    const { voteType } = req.body;
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    
    if (voteType === 1) faq.upvoteCount += 1;
    else if (voteType === -1) faq.downvoteCount += 1;
    
    await faq.save();
    res.json(faq);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const FAQEditSuggestion = require('../models/FAQEditSuggestion');

const suggestEdit = async (req, res) => {
  try {
    const { proposedTitle, proposedAnswer } = req.body;
    const faqId = req.params.id;

    if (!proposedTitle || !proposedAnswer) {
      return res.status(400).json({ message: 'Proposed title and answer are required.' });
    }

    const suggestion = new FAQEditSuggestion({
      faq: faqId,
      suggestedBy: req.user._id,
      proposedTitle,
      proposedAnswer
    });
    
    await suggestion.save();
    res.status(201).json(suggestion);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getPendingSuggestions = async (req, res) => {
  try {
    const suggestions = await FAQEditSuggestion.find({ status: 'pending' })
      .populate('faq', 'title answer slug')
      .populate('suggestedBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const reviewSuggestion = async (req, res) => {
  try {
    const { status, adminFeedback } = req.body; // 'approved' or 'rejected'
    const suggestion = await FAQEditSuggestion.findById(req.params.suggestionId).populate('faq');
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

    suggestion.status = status;
    if (adminFeedback) suggestion.adminFeedback = adminFeedback;
    await suggestion.save();

    if (status === 'approved') {
      const faq = suggestion.faq;
      faq.title = suggestion.proposedTitle;
      faq.answer = suggestion.proposedAnswer;
      faq.status = 'published'; // ensure it stays published
      
      // Update Embedding
      const embeddingText = `${faq.title}\n${faq.question}\n${faq.answer}`;
      faq.embedding = await generateEmbedding(embeddingText);
      
      await faq.save();
      
      const { createNotification } = require('./notificationController');
      await createNotification(
        suggestion.suggestedBy,
        'accepted',
        `Your suggested edit for "${faq.title}" was approved!`,
        `/faqs/${faq.slug}`
      );
      if (req.io) req.io.to(`user_${suggestion.suggestedBy}`).emit('new_notification');
    }

    res.json(suggestion);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

let isBackfilling = false;

const backfillEmbeddings = async (req, res) => {
  try {
    if (isBackfilling) {
      return res.status(429).json({ message: 'A background backfill job is already running.' });
    }

    const faqs = await FAQ.find({ 
      status: 'published', 
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } },
        { embedding: { $not: { $size: 768 } } }
      ]
    });
    if (faqs.length === 0) {
      return res.json({ message: 'All published FAQs already have embeddings.' });
    }

    isBackfilling = true;
    res.json({ message: `Started background backfill for ${faqs.length} FAQs.` });

    // Run in background to avoid blocking and handle rate limits
    setTimeout(async () => {
      try {
        for (const faq of faqs) {
          try {
            const embeddingText = `${faq.title}\n${faq.question}\n${faq.answer}`;
            faq.embedding = await generateEmbedding(embeddingText);
            await faq.save();
            console.log(`✅ Backfilled embedding for FAQ: ${faq.title}`);
            // Basic delay to avoid hitting Gemini rate limits (e.g., 2 seconds)
            await new Promise(r => setTimeout(r, 2000));
          } catch (err) {
            console.error(`❌ Failed to backfill FAQ: ${faq.title}`, err.message);
          }
        }
        console.log('🎉 Background embedding backfill complete!');
      } finally {
        isBackfilling = false;
      }
    }, 0);

  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { 
  getCategories, 
  getFAQs, 
  getMyFAQs,
  getPendingFAQs, 
  getFAQBySlug, 
  createFAQ, 
  updateFAQStatus,
  voteFAQ,
  suggestEdit,
  getPendingSuggestions,
  reviewSuggestion,
  backfillEmbeddings
};
