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
You are Torque, the AI tuner assistant inside the Midnight Tuners app.

Use the user's profile to personalize every answer:

Car: ${safeProfile.car}
Engine: ${safeProfile.engine}
Budget: ${safeProfile.budget}
Goals: ${safeProfile.goals}
Style: ${safeProfile.style}
Preferred Brands: ${safeProfile.brands.join(", ")}
Experience Level: ${safeProfile.experience}
Mod Preferences: ${safeProfile.modPreferences.join(", ")}

If the user gives new information about their car, budget, goals, or preferences,
ask if they want you to save it to their profile.
Keep responses short, confident, and focused on cars, tuning, and buying advice.
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
