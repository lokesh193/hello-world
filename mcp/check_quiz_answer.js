import { quizFor } from "lib/study.js";

export const access = "public";

export default {
  name: "check_quiz_answer",
  description: "Check one learner answer against the ECE quiz bank, explain the result, and return a transparent mastery increment.",
  inputSchema: {
    type: "object",
    required: ["topic", "question_index", "answer_index"],
    properties: {
      topic: { type: "string" },
      question_index: { type: "integer", minimum: 0 },
      answer_index: { type: "integer", minimum: 0 }
    }
  },
  async handler({ topic, question_index, answer_index }) {
    const quiz = quizFor(topic);
    const idx = Math.max(0, Math.min(quiz.questions.length - 1, Number(question_index) || 0));
    const q = quiz.questions[idx];
    const selected = Number(answer_index);
    if (!Number.isInteger(selected) || selected < 0 || selected >= q.options.length) throw new Error("Choose a valid answer option.");
    const correct = selected === q.correct;
    return {
      topic: quiz.topic,
      question_index: idx,
      correct,
      selected_answer: q.options[selected],
      correct_index: q.correct,
      correct_answer: q.options[q.correct],
      explanation: q.explanation,
      mastery_increment: correct ? 10 : 0,
      feedback: correct ? "Correct. " + q.explanation : "Not quite. The correct answer is: " + q.options[q.correct] + ". " + q.explanation
    };
  }
};