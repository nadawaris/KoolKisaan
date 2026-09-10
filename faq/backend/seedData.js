const mongoose = require('mongoose');
const User = require('./models/User');
const { Question, Answer } = require('./models/QA');
const { FAQ } = require('./models/FAQ');
const importSqliteData = require('./importSqlite');

const seedDatabase = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await importSqliteData();
      console.log('🌱 Database seeded with real SQLite data!');
    }

    // Force migration of any old embeddings (e.g. 3072 dims) to the strict 768 dim schema
    const faqsToReEmbed = await FAQ.find({ 
      status: 'published', 
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } },
        { embedding: { $not: { $size: 768 } } }
      ]
    });
    
    if (faqsToReEmbed.length > 0) {
      console.log(`🔄 Found ${faqsToReEmbed.length} FAQs needing embedding dimension updates (768-dim required). Migrating in background...`);
      const { generateEmbedding } = require('./utils/embeddings');
      setTimeout(async () => {
        for (const faq of faqsToReEmbed) {
          try {
            const text = `${faq.title}\n${faq.question}\n${faq.answer}`;
            faq.embedding = await generateEmbedding(text);
            await faq.save();
            console.log(`✅ Automatically corrected embedding for FAQ: ${faq.title}`);
            await new Promise(r => setTimeout(r, 2000));
          } catch (e) {
            console.error("Migration error:", e.message);
          }
        }
        console.log("🎉 Embedding dimension migration complete.");
      }, 0);
    }

  } catch (error) {
    console.error('Error seeding DB:', error);
  }
};

module.exports = seedDatabase;
