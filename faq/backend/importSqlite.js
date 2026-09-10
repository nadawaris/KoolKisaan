const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');
const { Question, Answer } = require('./models/QA');
const { FAQ } = require('./models/FAQ');

async function importSqliteData() {
  // Accept explicit path via env var, and fall back to common locations.
  const candidates = [
    process.env.SQLITE_PATH,
    path.join(__dirname, '..', '..', 'faq_project', 'db.sqlite3'),
    path.join(__dirname, '..', 'db.sqlite3'),
    path.join(__dirname, 'db.sqlite3'),
    path.join(process.cwd(), 'db.sqlite3')
  ].filter(Boolean);

  const sqlitePath = candidates.find(p => fs.existsSync(p));

  if (!sqlitePath) {
    console.error('Error: no SQLite database file found. Searched paths:');
    candidates.forEach(p => console.error(' -', p));
    console.error('\nSet the SQLITE_PATH environment variable to the correct .sqlite file,\n' +
      'or place the DB at one of the locations above.');
    throw new Error('SQLite DB file not found');
  }

  try {
    const db = await open({
      filename: sqlitePath,
      driver: sqlite3.Database
    });

    console.log(`📦 Connecting to SQLite database at: ${sqlitePath}`);

    // 1. Import Users
    const users = await db.all(`SELECT id, username, email, password, is_superuser, is_staff, is_active FROM auth_user`);
    const profiles = await db.all(`SELECT user_id, reputation, bio FROM accounts_userprofile`);
    
    // Create a map to link SQLite IDs to MongoDB _ids
    const userIdMap = {};
    
    for (const u of users) {
      const profile = profiles.find(p => p.user_id === u.id);
      
      const role = u.is_superuser ? 'legacy_account' : (u.is_staff ? 'legacy_account' : 'user');
      const rep = profile ? profile.reputation : 0;
      const bio = profile ? profile.bio : '';

      const newUser = await User.create({
        username: u.username,
        email: u.email || `${u.username}@example.com`,
        password: u.password, // Keep the hashed password string
        role: role,
        reputation: rep,
        bio: bio,
        isEmailVerified: true
      });
      userIdMap[u.id] = newUser._id;
    }
    console.log(`✅ Imported ${users.length} Users`);

    // 2. Import Categories (for FAQs and Questions)
    const Category = require('./models/FAQ').Category;
    const categories = await db.all(`SELECT id, name, slug FROM faqs_category`);
    const categoryIdMap = {};
    for (const c of categories) {
      const newCat = await Category.create({ name: c.name, slug: c.slug });
      categoryIdMap[c.id] = newCat._id;
    }
    console.log(`✅ Imported ${categories.length} Categories`);

    // 3. Import FAQs
    const faqs = await db.all(`SELECT id, title, slug, question, answer, category_id, status, view_count, upvote_count, downvote_count, created_at FROM faqs_faq`);
    for (const f of faqs) {
      await FAQ.create({
        title: f.title,
        slug: f.slug,
        question: f.question,
        answer: f.answer,
        category: categoryIdMap[f.category_id],
        status: 'published', // Force published so they show up on the frontend
        viewCount: f.view_count,
        upvoteCount: f.upvote_count,
        downvoteCount: f.downvote_count
      });
    }
    console.log(`✅ Imported ${faqs.length} FAQs`);

    // 4. Import Questions
    const questions = await db.all(`SELECT id, title, body, author_id, category_id, view_count, is_answered, upvote_count, downvote_count, created_at FROM qa_question`);
    const questionIdMap = {};
    for (const q of questions) {
      const newQuestion = await Question.create({
        title: q.title,
        body: q.body,
        author: userIdMap[q.author_id],
        category: categoryIdMap[q.category_id],
        viewCount: q.view_count,
        isAnswered: q.is_answered,
        upvoteCount: q.upvote_count,
        downvoteCount: q.downvote_count
      });
      questionIdMap[q.id] = newQuestion._id;
    }
    console.log(`✅ Imported ${questions.length} Q&A Threads`);

    // 5. Import Answers
    const answers = await db.all(`SELECT id, question_id, author_id, body, is_accepted, upvote_count, downvote_count, created_at FROM qa_answer`);
    for (const a of answers) {
      await Answer.create({
        question: questionIdMap[a.question_id],
        author: userIdMap[a.author_id],
        body: a.body,
        isAccepted: a.is_accepted,
        upvoteCount: a.upvote_count,
        downvoteCount: a.downvote_count
      });
    }
    console.log(`✅ Imported ${answers.length} Answers`);
    
    await db.close();
    console.log(`🎉 Full SQLite to MongoDB Memory Server migration complete!`);
    
  } catch (error) {
    console.error('Error importing from SQLite:', error);
  }
}

module.exports = importSqliteData;
