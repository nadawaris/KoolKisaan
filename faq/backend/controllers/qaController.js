const { Question, Answer, Comment } = require('../models/QA');
const { createNotification } = require('./notificationController');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { FAQ } = require('../models/FAQ');
const { generateEmbedding, cosineSimilarity } = require('../utils/embeddings');

const checkModeration = async (text) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analyze the following text. Is it abusive, highly toxic, or sexual? Reply strictly with exactly 'SAFE' or 'REJECT'. Text: "${text}"`;
    const result = await model.generateContent(prompt);
    const intent = result.response.text().trim().toUpperCase();
    return intent === 'REJECT';
  } catch (err) {
    console.error("Moderation AI Error:", err.message);
    return false; // allow by default if AI fails
  }
};

const autoAnswerQuestion = async (questionId, title, body, authorId, io) => {
  try {
    const queryEmbedding = await generateEmbedding(`${title}\n${body}`);
    if (!queryEmbedding || queryEmbedding.length === 0) return;

    const faqs = await FAQ.find({ status: 'published' });
    const scoredFaqs = faqs.map(faq => {
      let score = 0;
      if (faq.embedding && faq.embedding.length > 0) {
        score = cosineSimilarity(queryEmbedding, faq.embedding);
      }
      return { faq, score };
    }).filter(item => item.score > 0.65).sort((a, b) => b.score - a.score).slice(0, 3);

    if (scoredFaqs.length === 0) return;

    const context = scoredFaqs.map(item => `Q: ${item.faq.title}\nA: ${item.faq.answer}`).join("\n\n");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are 'Yaksha', an ultra-fast AI assistant for VLED. A user just asked a question in the community hub.
Answer their question in a helpful, friendly, and slightly Gen-Z/Hinglish tone.
You MUST base your answer strictly on the following FAQ knowledge base context. If the context doesn't fully answer the question, say so politely.

FAQ CONTEXT:
${context}

USER'S QUESTION:
Title: ${title}
Body: ${body}

Write your answer in Markdown format. Keep it concise but fully answer the question.`;
    
    const result = await model.generateContent(prompt);
    const answerText = result.response.text();

    const answer = new Answer({ body: answerText, question: questionId, isAI: true });
    await answer.save();

    await createNotification(
      authorId,
      'answer',
      `✨ Yaksha Auto-Answered your question "${title.substring(0, 30)}..."`,
      `/qa/${questionId}`
    );
    if (io) io.to(`user_${authorId}`).emit('new_notification');
    
  } catch (err) {
    console.error("Auto-Answer Pipeline Error:", err.message);
  }
};

const getQuestions = async (req, res) => {
  try {
    const sortQuery = req.query.sort;
    let sortObj = { createdAt: -1 };
    
    if (sortQuery === 'top') {
      sortObj = { upvoteCount: -1, createdAt: -1 };
    } else if (sortQuery === 'hot') {
      sortObj = { viewCount: -1, upvoteCount: -1, createdAt: -1 };
    }
    
    const questions = await Question.find({})
      .populate('author', 'username badge')
      .populate('category', 'name')
      .sort(sortObj);
    res.json(questions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'username avatar role')
      .populate('category', 'name');
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    // Increment view count for unique IPs
    const userIp = req.ip || req.connection?.remoteAddress || 'unknown';
    if (!question.viewers.includes(userIp)) {
      question.viewers.push(userIp);
      question.viewCount += 1;
      await question.save();
    }
    
    // Fetch answers and populate comments
    const answers = await Answer.find({ question: question._id })
      .populate('author', 'username avatar')
      .sort({ isAccepted: -1, upvoteCount: -1 });
      
    // Fetch comments for these answers
    const answerIds = answers.map(a => a._id);
    const comments = await Comment.find({ answer: { $in: answerIds } })
      .populate('author', 'username avatar');
      
    // Attach comments to answers
    const answersWithComments = answers.map(ans => {
      const ansObj = ans.toObject();
      ansObj.comments = comments.filter(c => c.answer.toString() === ans._id.toString());
      return ansObj;
    });
      
    res.json({ question, answers: answersWithComments });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createQuestion = async (req, res) => {
  try {
    const { title, body, category, tags } = req.body;
    
    // AI Content Moderation
    const isToxic = await checkModeration(`${title} ${body}`);
    if (isToxic) {
      return res.status(400).json({ message: 'Content rejected by automated moderation.' });
    }

    const question = new Question({ title, body, category, tags, author: req.user._id });
    const createdQuestion = await question.save();
    
    // Kick off auto-answer pipeline asynchronously
    autoAnswerQuestion(createdQuestion._id, title, body, req.user._id, req.io);

    res.status(201).json(createdQuestion);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const createAnswer = async (req, res) => {
  try {
    const { body } = req.body;
    
    // AI Content Moderation
    const isToxic = await checkModeration(body);
    if (isToxic) {
      return res.status(400).json({ message: 'Content rejected by automated moderation.' });
    }

    const questionId = req.params.id;
    const answer = new Answer({ body, question: questionId, author: req.user._id });
    const createdAnswer = await answer.save();
    
    // Notify question author
    const question = await Question.findById(questionId);
    if (question && question.author.toString() !== req.user._id.toString()) {
      await createNotification(
        question.author, 
        'answer', 
        `${req.user.username} answered your question "${question.title.substring(0, 30)}..."`,
        `/qa/${questionId}`
      );
      // Emit live notification to user
      if (req.io) req.io.to(`user_${question.author}`).emit('new_notification');
    }
    
    res.status(201).json(createdAnswer);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const voteQuestion = async (req, res) => {
  try {
    const { voteType } = req.body; // 1 or -1
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    const userId = req.user._id;
    const hasUpvoted = question.upvotes.includes(userId);
    const hasDownvoted = question.downvotes.includes(userId);

    let reputationChange = 0;

    if (voteType === 1) {
      if (hasUpvoted) {
        question.upvotes.pull(userId);
        question.upvoteCount = Math.max(0, question.upvoteCount - 1);
        reputationChange = -10;
      } else {
        question.upvotes.push(userId);
        question.upvoteCount += 1;
        reputationChange = 10;
        if (hasDownvoted) {
          question.downvotes.pull(userId);
          question.downvoteCount = Math.max(0, question.downvoteCount - 1);
        }
      }
    } else if (voteType === -1) {
      if (hasDownvoted) {
        question.downvotes.pull(userId);
        question.downvoteCount = Math.max(0, question.downvoteCount - 1);
      } else {
        question.downvotes.push(userId);
        question.downvoteCount += 1;
        if (hasUpvoted) {
          question.upvotes.pull(userId);
          question.upvoteCount = Math.max(0, question.upvoteCount - 1);
          reputationChange = -10;
        }
      }
    }
    
    const User = require('../models/User');
    const author = await User.findById(question.author);
    if (author && reputationChange !== 0) {
      author.reputation += reputationChange;
      await author.save();
    }
    
    await question.save();
    res.json(question);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const voteAnswer = async (req, res) => {
  try {
    const { voteType } = req.body;
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    
    const userId = req.user._id;
    const hasUpvoted = answer.upvotes.includes(userId);
    const hasDownvoted = answer.downvotes.includes(userId);

    let reputationChange = 0;

    if (voteType === 1) {
      if (hasUpvoted) {
        answer.upvotes.pull(userId);
        answer.upvoteCount = Math.max(0, answer.upvoteCount - 1);
        reputationChange = -10;
      } else {
        answer.upvotes.push(userId);
        answer.upvoteCount += 1;
        reputationChange = 10;
        if (hasDownvoted) {
          answer.downvotes.pull(userId);
          answer.downvoteCount = Math.max(0, answer.downvoteCount - 1);
        }
      }
    } else if (voteType === -1) {
      if (hasDownvoted) {
        answer.downvotes.pull(userId);
        answer.downvoteCount = Math.max(0, answer.downvoteCount - 1);
      } else {
        answer.downvotes.push(userId);
        answer.downvoteCount += 1;
        if (hasUpvoted) {
          answer.upvotes.pull(userId);
          answer.upvoteCount = Math.max(0, answer.upvoteCount - 1);
          reputationChange = -10;
        }
      }
    }
    
    const User = require('../models/User');
    const author = await User.findById(answer.author);
    if (author && reputationChange !== 0) {
      author.reputation += reputationChange;
      await author.save();
    }
    
    await answer.save();
    res.json(answer);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    
    const question = await Question.findById(answer.question);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    // Authorization guard: Only the question author can accept an answer
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the question author can accept an answer' });
    }

    // Idempotency guards
    if (answer.isAccepted) return res.status(400).json({ message: 'Answer is already accepted' });
    if (question.isAnswered) return res.status(400).json({ message: 'Question already has an accepted answer' });

    answer.isAccepted = true;
    question.isAnswered = true;
    
    const User = require('../models/User');
    const author = await User.findById(answer.author);
    if (author) {
      author.reputation += 20; // Points for accepted answer
      await author.save();
      
      // Notify answer author
      if (author._id.toString() !== req.user._id.toString()) {
        await createNotification(
          author._id,
          'accepted',
          `Your answer was accepted! You gained +20 rep.`,
          `/qa/${question._id}`
        );
        if (req.io) req.io.to(`user_${author._id}`).emit('new_notification');
      }
    }
    
    await answer.save();
    await question.save();
    res.json(answer);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createComment = async (req, res) => {
  try {
    const { body } = req.body;
    const answerId = req.params.id;
    // Allow anonymous replies if no token, just to demonstrate UI parity
    const authorId = req.user ? req.user._id : null; 
    const comment = new Comment({ body, answer: answerId, author: authorId });
    await comment.save();
    
    // Notify answer author
    const AnswerModel = require('../models/QA').Answer;
    const answer = await AnswerModel.findById(answerId).populate('question');
    if (answer && answer.author && answer.author.toString() !== (authorId ? authorId.toString() : '')) {
      await createNotification(
        answer.author,
        'comment',
        `Someone commented on your answer.`,
        `/qa/${answer.question._id}`
      );
      if (req.io) req.io.to(`user_${answer.author}`).emit('new_notification');
    }

    res.status(201).json(comment);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const getUserQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ author: req.user.id })
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getUserAnswers = async (req, res) => {
  try {
    const answers = await Answer.find({ author: req.user.id })
      .populate({ path: 'question', populate: { path: 'category' } })
      .sort({ createdAt: -1 });
    res.json(answers);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getQuestions, getQuestionById, createQuestion, createAnswer, voteQuestion, voteAnswer, acceptAnswer, createComment, getUserQuestions, getUserAnswers };
