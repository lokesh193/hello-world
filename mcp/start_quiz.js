import { quizFor } from "lib/study.js";

export const access = "public";

export default {
  name: "start_quiz",
  description: "Return one multiple-choice ECE revision question for the selected topic. Use check_quiz_answer after the learner chooses an answer.",
  inputSchema: {
    type: "object",
    required: ["topic"],
    properties: {
      topic: { type: "string", description: "Quiz topic: DSP architecture, FIR filters, Q15 number format, or MAC unit." },
      question_index: { type: "integer", minimum: 0, description: "Question number, starting at zero." }
    }
  },
  async handler({ topic, question_index = 0 }) {
    const quiz = quizFor(topic);
    const idx = Math.max(0, Math.min(quiz.questions.length - 1, Number.isInteger(question_index) ? question_index : 0));
    const q = quiz.questions[idx];
    return { topic: quiz.topic, question_index: idx, question: q.question, options: q.options, answer_required: true };
  }
};