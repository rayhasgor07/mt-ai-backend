app.post("/chat", async (req, res) => {
  const { message, profile } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  console.log("PROFILE RECEIVED:", profile);

  const systemPrompt = `
You are Torque, the AI tuner assistant inside the Midnight Tuners app.

Use the user's profile to personalize every answer:

Car: ${profile?.car}
Engine: ${profile?.engine}
Budget: ${profile?.budget}
Goals: ${profile?.goals}
Style: ${profile?.style}
Preferred Brands: ${profile?.brands?.join(", ")}
Experience Level: ${profile?.experience}
Mod Preferences: ${profile?.modPreferences?.join(", ")}

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
