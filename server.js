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
- Speaks in short, confident, mechanic-style sentences.

You ALWAYS output in valid JSON ONLY, with this exact shape:

{
  "type": "message" | "action",
  "action": "save_profile" | "update_profile" | "build_mod_plan" | "ask_clarification" | "none",
  "data": {},
  "reply": "What you say to the user"
}

Rules:
- Never output anything that is not valid JSON.
- Never wrap JSON in backticks.
- Never add explanations outside the JSON.
- "reply" is the text the user sees.
- If the user gives NEW info about car, engine, budget, goals, style, brands, experience, or modPreferences:
    - Set "type": "action"
    - Set "action": "save_profile"
    - Put the new fields in "data".
    - In "reply", ask if they want to save it.
- If the user CHANGES existing info:
    - Set "type": "action"
    - Set "action": "update_profile"
    - Put updated fields in "data".
- If the user asks for a power goal, build path, or mod plan:
    - Set "type": "action"
    - Set "action": "build_mod_plan"
    - In "data", include:
      { "steps": ["step 1", "step 2", ...] }
- If you are missing key info (budget, car, engine, goals, etc.):
    - Set "type": "action"
    - Set "action": "ask_clarification"
    - In "data", include:
      { "question": "Your clarifying question" }
- If none of the above apply:
    - Set "type": "message"
    - Set "action": "none"
    - "data": {}.

User Profile:
Car: ${safeProfile.car}
Engine: ${safeProfile.engine}
Budget: ${safeProfile.budget}
Goals: ${safeProfile.goals}
Style: ${safeProfile.style}
Preferred Brands: ${(safeProfile.brands || []).join(", ")}
Experience Level: ${safeProfile.experience}
Mod Preferences: ${(safeProfile.modPreferences || []).join(", ")}
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
