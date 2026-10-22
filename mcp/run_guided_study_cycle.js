import { searchMaterials, topicFor, quizFor } from "lib/study.js";

export const access = "public";

export default {
  name: "run_guided_study_cycle",
  description: "Compose a study workflow that searches the built-in ECE reference pack, explains a selected topic, and returns one practice question. Results are source-labelled and deterministic.",
  inputSchema: {
    type: "object",
    required: ["topic"],
    properties: {
      topic: { type: "string", description: "Topic such as DSP architecture, FIR filters, Q15 number format, or MAC unit." },
      level: { type: "string", enum: ["simple", "exam", "detailed"] },
      student_notes: { type: "string", description: "Optional notes excerpt. Returned separately rather than represented as a generated synthesis." },
      question_index: { type: "integer", minimum: 0 }
    }
  },
  async handler({ topic, level = "simple", student_notes, question_index = 0 }) {
    const material = topicFor(topic);
    const search = searchMaterials(topic);
    const quiz = quizFor(topic);
    const index = Math.max(0, Math.min(quiz.questions.length - 1, Number.isInteger(question_index) ? question_index : 0));
    const question = quiz.questions[index];
    const notes = String(student_notes || "").trim().slice(0, 1200);
    let explanation = material.body;
    if (level === "simple") explanation = "In simple terms: " + material.body;
    if (level === "exam") explanation = "Exam-ready reference explanation: " + material.body + " Key points: define the concept, explain the data flow or calculation, and state one practical use.";
    if (level === "detailed") explanation = material.body + " Study check: explain the definition, flow, key operation, and one implementation limitation in your own words.";
    return {
      workflow: "search_explain_quiz",
      topic: material.title,
      source: "Built-in ECE study pack",
      steps: [
        {
          step: 1,
          tool: "search_study_material",
          query: topic,
          matches: search,
          source: "Built-in ECE study pack"
        },
        {
          step: 2,
          tool: "explain_concept",
          topic: material.title,
          level,
          explanation,
          source: "Built-in ECE study pack"
        },
        {
          step: 3,
          tool: "start_quiz",
          topic: quiz.topic,
          question_index: index,
          question: question.question,
          options: question.options
        }
      ],
      student_notes_excerpt: notes,
      notice: "This composite tool uses deterministic reference content. Student notes are returned separately; this version does not claim generative synthesis, image OCR, or an official assessment."
    };
  }
};