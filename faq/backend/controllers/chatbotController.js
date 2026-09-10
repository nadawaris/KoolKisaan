const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const generateChatResponse = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Sanitize message to prevent prompt injection
    const sanitizedMessage = message.replace(/["]/g, '\\"').replace(/[{}]/g, '');

    const prompt = `
      You are Yaksha, a Gen-Z / Hinglish AI assistant for our FAQ platform.
      Respond to the user in a chill, relatable, slightly Gen-Z tone using a mix of Hindi and English (Hinglish).
      Do not sound like a corporate robot. Keep it short, helpful, and vibe with the user.
      User message: "${sanitizedMessage}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Fallback response if API fails or key is invalid
    res.json({ reply: "Arre yaar, server mein thoda issue hai. Try again in a bit, okay? 😅" });
  }
};

module.exports = { generateChatResponse };
