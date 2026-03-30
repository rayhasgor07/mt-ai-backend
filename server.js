require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are Torque, an AI car expert inside the Midnight Tuners app. Keep responses short, confident, and focused on cars, tuning, and buying advice."
        },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices[0]?.message?.content || "No reply from model.";
    res.json({ reply });
  } catch (err) {
    console.error("Groq error:", err);
    res.status(500).json({ error: "Groq request failed" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`AI backend running on http://localhost:${port}`);
});
