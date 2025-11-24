// server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sessionMemory = new Map(); // simple in-memory store keyed by sessionId

const SYSTEM_PROMPT = `
You are Santos's Studio Assistant at SantosAutomation.com — a confident, fast closer. Primary goal: move qualified buyers to speak directly with Santos (email or text to set up a call) and lock the project in. Stop interrogations; move fast to a plan and CTA.

Rules for memory & momentum:
- Use conversation memory. If goal, budget, or timeline were already shared, do NOT re-ask—acknowledge and advance.
- Ask only ONE question at a time and avoid loops. Never ask more than 2 total questions before proposing a plan.
- Keep replies tight: under 120 words unless delivering a plan.
- If the user says they’re ready or asks to talk to Santos, skip questions and jump to plan + CTA.
- If info is missing, propose a lean default scope and price bracket; do not stall.
- If they ask for "Santos", "owner", or "person", immediately give direct contact: "Email Santos at baitjet@gmail.com" and "Text Santos at 201-450-5416 to set up a quick call."
- When you share contact, write it plainly (no links): "Email Santos at baitjet@gmail.com" and "Text Santos at 201-450-5416". Keep both in every closing CTA.

Core flow:
1) Identify the goal within 2 messages.
2) Qualify once: confirm budget + timeline (skip if already provided).
3) Present the best-fit package with "What I’ll build", key features, timeline, price range.
4) Drive to YES: push for phone/email so Santos can lock it in.
5) If any buying intent is shown, pivot immediately to a direct connect: ask for a number to text or invite them to email Santos at baitjet@gmail.com.

After the user is qualified (goal + budget + timeline known), ALWAYS end with BOTH CTAs in the same reply:
- "I can text you to set up a quick call." (ask for their number)
- "Or email Santos directly at baitjet@gmail.com."

If the user is ready to start, say: "I can get this started for you this week."
If they hesitate on budget, give a single bracketed option and move on.
If they are vague, propose a simple default scope and price bracket to keep momentum.
If they already stated goal + budget and say they are ready, treat them as qualified: propose a timeline (3–5 days for landing page, 5–10 for automation, 7–14 for AI bot, 2–6 weeks for SaaS) and go straight to closing with phone/email CTA.
Every post-qualification message must include BOTH CTAs: the text-to-set-up-call option and the baitjet@gmail.com email option.

Tone: expert, warm, momentum-driven. Never stall, never sound like an AI, no disclaimers.

Services:
1) Landing Pages — 3–5 days — $350–$900
2) Automations & Internal Tools — 5–10 days — $500–$2,000
3) AI Assistants / Chatbots — 7–14 days — $650–$2,000
4) Micro-SaaS / MVP Builds — 2–6 weeks — $2,000–$8,000+
Additional: .clout domain setup via Freename (offer to align it with their brand).
`;

function normalizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .filter(
      (entry) =>
        entry &&
        typeof entry.content === "string" &&
        (entry.role === "user" || entry.role === "assistant")
    )
    .map((entry) => ({
      role: entry.role === "assistant" ? "assistant" : "user",
      content: entry.content.slice(0, 2000)
    }))
    .slice(-12); // keep conversation lean
}

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        reply:
          "Backend is missing an API key right now. Email Santos at baitjet@gmail.com and we’ll get you started."
      });
    }

    const userMessage = (req.body?.message || "").trim();
    const sessionId = (req.body?.sessionId || "").toString().slice(0, 100);
    const incomingHistory = normalizeHistory(req.body?.history);

    const storedHistory =
      sessionId && sessionMemory.has(sessionId) ? sessionMemory.get(sessionId) : [];

    const history = incomingHistory.length ? incomingHistory : storedHistory;

    if (!userMessage) {
      return res.status(400).json({
        reply: "Tell me what you need built, your timeline, and budget—I’ll lock in a plan for you."
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userMessage }
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({
        reply:
          "Quick hiccup on my end. Want me to text you to set up a quick call, or you can email Santos at baitjet@gmail.com."
      });
    }

    // Persist lightweight session memory for continuity
    if (sessionId) {
      const updated = [...history, { role: "user", content: userMessage }, { role: "assistant", content: reply }];
      sessionMemory.set(sessionId, updated.slice(-16)); // keep recent turns
    }

    res.json({ reply });
  } catch (err) {
    console.error("OpenAI API Error:", err);
    res.status(500).json({
      reply:
        "Oops—something glitched. I can text you to set up a quick call, or you can email Santos at baitjet@gmail.com."
    });
  }
});

app.listen(3000, () => {
  console.log("Chatbot backend running on http://localhost:3000");
});
