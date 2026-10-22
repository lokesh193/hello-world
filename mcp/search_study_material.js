import { searchMaterials } from "lib/study.js";

export const access = "public";

export default {
  name: "search_study_material",
  description: "Search a built-in ECE study pack and optional learner-provided text. Returns source-labelled results and does not claim to OCR images or search the web.",
  inputSchema: {
    type: "object",
    required: ["query"],
    properties: {
      query: { type: "string", description: "Topic or phrase to search in the built-in study pack." },
      student_notes: { type: "string", description: "Optional notes supplied for this request only; not stored." }
    }
  },
  async handler({ query, student_notes }) {
    const matches = searchMaterials(query);
    const notes = String(student_notes || "").slice(0, 2400);
    return {
      source: notes ? "Built-in ECE study pack and learner-provided notes excerpt" : "Built-in ECE study pack",
      query,
      matches,
      learner_notes_excerpt: notes,
      notice: matches.length ? "Built-in matches are reference material, not proof that they match a particular uploaded diagram or textbook edition." : "No close built-in match. Try a shorter topic phrase."
    };
  }
};