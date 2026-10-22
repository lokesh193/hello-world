export const access = "public";

export default {
  name: "save_progress",
  description: "Save a learner's latest topic, section and mastery with a random anonymous browser key. Does not store their study notes or direct personal identity.",
  inputSchema: {
    type: "object",
    required: ["learner_key", "topic"],
    properties: {
      learner_key: { type: "string", description: "Random, browser-generated anonymous key; never use an email or real name." },
      topic: { type: "string" },
      section: { type: "string" },
      mastery: { type: "integer", minimum: 0, maximum: 100 },
      actions_count: { type: "integer", minimum: 0 },
      correct_answers: { type: "integer", minimum: 0 },
      topics_explored: { type: "array", items: { type: "string" } }
    }
  },
  async handler(args, ctx) {
    const key = String(args.learner_key || "");
    if (!/^[a-zA-Z0-9_-]{20,100}$/.test(key)) throw new Error("A valid anonymous learner key is required.");
    const topic = String(args.topic || "DSP architecture").slice(0,100);
    const section = String(args.section || "").slice(0,120);
    const mastery = Math.max(0, Math.min(100, Number(args.mastery) || 0));
    const actions = Math.max(0, Math.min(10000, Number(args.actions_count) || 0));
    const correct = Math.max(0, Math.min(10000, Number(args.correct_answers) || 0));
    const topics = Array.isArray(args.topics_explored) ? args.topics_explored.map(x => String(x).slice(0,100)).slice(0,20) : [];
    const { rows } = await ctx.db.query(
      "INSERT INTO study_progress (learner_key,last_topic,last_section,mastery,actions_count,correct_answers,topics_explored,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,NOW()) ON CONFLICT (learner_key) DO UPDATE SET last_topic=EXCLUDED.last_topic,last_section=EXCLUDED.last_section,mastery=EXCLUDED.mastery,actions_count=EXCLUDED.actions_count,correct_answers=EXCLUDED.correct_answers,topics_explored=EXCLUDED.topics_explored,updated_at=NOW() RETURNING last_topic,last_section,mastery,actions_count,correct_answers,topics_explored,updated_at",
      [key, topic, section, mastery, actions, correct, JSON.stringify(topics)]
    );
    return { saved: true, progress: rows[0], privacy: "Only the anonymous key, topic, section and progress counters are stored. Study notes are not saved." };
  }
};