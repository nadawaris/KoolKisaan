const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTest = ['gemini-embedding-2'];
  
  for (const m of modelsToTest) {
    try {
      console.log(`Testing model: ${m}`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.embedContent("Hello world");
      console.log(`Success with ${m}! Dimensions: ${res.embedding.values.length}`);
    } catch (err) {
      console.error(`Failed with ${m}: ${err.message}`);
    }
  }
}

run();
