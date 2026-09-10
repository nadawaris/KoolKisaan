require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await model.embedContent({
      content: { parts: [{ text: "Hello world" }] },
      outputDimensionality: 768
    });
    console.log("Success! Dimensions:", result.embedding.values.length);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
test();
