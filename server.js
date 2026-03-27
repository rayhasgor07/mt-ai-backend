require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post("/chat", async (req, res) => {
  const { message, profile } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  const safeProfile = profile || {
    car: null,
    engine: null,
    budget: null,
    goals: null,
    style: null,
    brands: [],
    experience: null,
    modPreferences: []
  };

  console.log("PROFILE RECEIVED:", safeProfile);

  const systemPrompt = `
You are Torque, the AI tuner agent inside the Midnight Tuners app.

You are not a chatbot. You are a tuner who:
- Understands goals
- Plans builds
- Tracks progress
- Updates user profile
- Asks for missing info
- Warns about risks
- Suggests alternatives
- Speaks short, confident, mechanic-style

You ALWAYS output in this JSON format:

{
  "type": "message" | "action",
  "action": "save_profile" | "update_profile" | "build_mod_plan" | "ask_clarification" | "none",
  "data": {},
  "reply": "What you say to the user"
}

User Profile:
Car: ${safeProfile.car}
Engine: ${safeProfile.engine}
Budget: ${safeProfile.budget}
Goals: ${safeProfile.goals}
Style: ${safeProfile.style}
Preferred Brands: ${(safeProfile.brands || []).join(", ")}
Experience Level: ${safeProfile.experience}
Mod Preferences: ${(safeProfile.modPreferences || []).join(", ")}

Rules:
- If the user gives new info, output an action: "save_profile"
- If the user changes info, output: "update_profile"
- If the user asks for power goals, output: "build_mod_plan"
- If info is missing, output: "ask_clarification"
- Otherwise, output: "message"
- Never break JSON format
- Never break character
  `;

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
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
