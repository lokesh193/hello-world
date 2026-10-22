import { topicFor } from "lib/study.js";

export const access = "public";

export default {
  name: "explain_concept",
  description: "Explain an ECE concept at a simple, exam-ready, or detailed level using the built-in study pack. Optional supplied notes are returned as a separate excerpt so the learner can compare source content transparently.",
  inputSchema: {
    type: "object",
    required: ["topic"],
    properties: {
      topic: { type: "string", description: "Topic such as DSP architecture, FIR filters, Q15 number format, or MAC unit." },
      level: { type: "string", enum: ["simple", "exam", "detailed"], description: "Explanation style." },
      student_notes: { type: "string", description: "Optional supplied notes excerpt, not stored." }
    }
  },
  async handler({ topic, level = "simple", student_notes }) {
    const material = topicFor(topic);
    const notes = String(student_notes || "").trim().slice(0, 1200);
    let explanation = material.body;
    if (level === "simple") explanation = "In simple terms: " + material.body;
    if (level === "exam") explanation = "Exam-ready reference explanation: " + material.body + " Key points to remember: define the concept, explain the signal or data flow, describe the main operation, and give one application.";
    if (level === "detailed") explanation = material.body + " Study check: explain the definition, the signal/data flow, the key operation, and one implementation limitation in your own words.";
    return {
      topic: material.title,
      section: material.section,
      level,
      source: "Built-in ECE study pack",
      explanation,
      learner_notes_excerpt: notes,
      transparency: notes ? "Your supplied notes are shown separately; this deterministic prototype does not claim a generative AI synthesis of arbitrary notes." : "No learner-provided notes were supplied."
    };
  }
};