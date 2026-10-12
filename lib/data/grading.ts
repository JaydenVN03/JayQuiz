export type QuizGradeResult = {
  score: number;
  totalPoints: number;
  correctCount: number;
  questionCount: number;
  questions: Array<{
    questionId: string;
    isCorrect: boolean;
    correctOptionIds: string[];
    explanation: string | null;
  }>;
};
