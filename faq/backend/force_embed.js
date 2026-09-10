require('dotenv').config();
const mongoose = require('mongoose');
const { FAQ } = require('./models/FAQ');
const { generateEmbedding } = require('./utils/embeddings');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/faqdb');
  console.log("Connected to MongoDB.");
  
  const faqs = await FAQ.find({ status: 'published' });
  console.log(`Found ${faqs.length} published FAQs to re-embed...`);

  for (const faq of faqs) {
    console.log(`Embedding: ${faq.title}`);
    const text = `${faq.title}\n${faq.question}\n${faq.answer}`;
    faq.embedding = await generateEmbedding(text);
    await faq.save();
    console.log(`Saved 768-dim embedding for: ${faq.title}`);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log("Done!");
  process.exit(0);
}
run().catch(console.error);
