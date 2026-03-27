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

You ALWAYS output valid JSON ONLY:

{
  "type": "message" | "action",
  "action": "save_profile" | "update_profile" | "build_mod_plan" | "ask_clarification" | "none",
  "data": {},
  "reply": "What you say to the user"
}

RULES:
- The profile shown below is ALWAYS the user's current saved profile. Treat it as 100% correct.
- NEVER ask for information that already exists in the profile.
- ONLY ask for missing info.
- If the user gives NEW info (car, engine, budget, goals, style, brands, experience, modPreferences):
    → type = "action", action = "save_profile", data = { new fields }
- If the user CHANGES info:
    → type = "action", action = "update_profile", data = { updated fields }
- If the user asks for a build path, hp goal, or mod plan:
    → type = "action", action = "build_mod_plan", data = { steps: [...] }
- If you need missing info:
    → type = "action", action = "ask_clarification", data = { question: "..." }
- Otherwise:
    → type = "message", action = "none", data = {}

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
