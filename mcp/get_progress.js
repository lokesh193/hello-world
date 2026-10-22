export const access = "public";

export default {
  name: "get_progress",
  description: "Retrieve saved study progress using the same random anonymous browser key created by StudySaathi.",
  inputSchema: {
    type: "object",
    required: ["learner_key"],
    properties: {
      learner_key: { type: "string", description: "Random browser-generated anonymous key previously used with save_progress." }
    }
  },
  async handler({ learner_key }, ctx) {
    const key = String(learner_key || "");
    if (!/^[a-zA-Z0-9_-]{20,100}$/.test(key)) throw new Error("A valid anonymous learner key is required.");
    const { rows } = await ctx.db.query(
      "SELECT last_topic,last_section,mastery,actions_count,correct_answers,topics_explored,updated_at FROM study_progress WHERE learner_key=$1 LIMIT 1",
      [key]
    );
    return { found: rows.length > 0, progress: rows[0] || null };
  }
};