
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function chatWithAI(req, res) {
  try {
    const { message, weather } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a message.",
      });
    }

    const weatherContext = weather
      ? JSON.stringify(weather, null, 2)
      : "No current weather data was provided.";

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `
You are Weather GPT, a helpful weather assistant.

- Answer clearly and naturally.
- Use the supplied weather data when relevant.
- Never invent current weather or forecasts.
- If weather data is missing, say so.
- You can answer general weather and climate questions.

Weather data:
${weatherContext}

User question:
${message}
`,
    });

    return res.json({
      success: true,
      reply: response.text,
    });
  } catch (error) {
    console.error("Gemini API error:", error.message);

    return res.status(500).json({
      success: false,
      message: "The AI assistant could not respond. Check the backend terminal.",
    });
  }
}

module.exports = { chatWithAI };
