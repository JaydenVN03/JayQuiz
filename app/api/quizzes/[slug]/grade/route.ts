import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import type { QuizGradeResult } from "@/lib/data/grading";

type RouteContext = { params: Promise<{ slug: string }> };
type SubmittedAnswers = Record<string, string | string[]>;

function isSubmittedAnswers(value: unknown): value is SubmittedAnswers {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const entries = Object.entries(value);
  return entries.length <= 200 && entries.every(
    ([questionId, answer]) =>
      /^[0-9a-f-]{36}$/i.test(questionId) &&
      ((typeof answer === "string" && answer.length <= 100) ||
        (Array.isArray(answer) &&
          answer.length <= 50 &&
          answer.every(
            (optionId) => typeof optionId === "string" && optionId.length <= 100,
          ))),
  );
}

function getSecretSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Supabase grading configuration is missing.");
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("answers" in body) ||
    !isSubmittedAnswers(body.answers)
  ) {
    return Response.json({ error: "Đáp án gửi lên không hợp lệ." }, { status: 400 });
  }

  const { slug } = await params;
  const supabase = getSecretSupabaseClient();
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (quizError) {
    throw new Error("Could not load quiz for grading.", { cause: quizError });
  }
  if (!quiz) {
    return Response.json({ error: "Không tìm thấy bộ đề." }, { status: 404 });
  }

  const { data: quizQuestions, error: quizQuestionsError } = await supabase
    .from("quiz_questions")
    .select("question_id, points")
    .eq("quiz_id", quiz.id)
    .order("sort_order");

  if (quizQuestionsError) {
    throw new Error("Could not load quiz questions for grading.", {
      cause: quizQuestionsError,
    });
  }
  if (quizQuestions.length === 0) {
    return Response.json({ error: "Bộ đề chưa có câu hỏi." }, { status: 409 });
  }

  const questionIds = quizQuestions.map((question) => question.question_id);
  const [{ data: questions, error: questionsError }, { data: options, error: optionsError }] =
    await Promise.all([
      supabase
        .from("questions")
        .select("id, explanation")
        .in("id", questionIds)
        .eq("status", "published"),
      supabase
        .from("options")
        .select("id, question_id, is_correct")
        .in("question_id", questionIds),
    ]);

  if (questionsError) {
    throw new Error("Could not load question explanations for grading.", {
      cause: questionsError,
    });
  }
  if (optionsError) {
    throw new Error("Could not load answer options for grading.", {
      cause: optionsError,
    });
  }

  const explanations = new Map(
    questions.map((question) => [question.id, question.explanation]),
  );
  const correctOptions = new Map<string, string[]>();
  for (const option of options) {
    if (option.is_correct) {
      const current = correctOptions.get(option.question_id) ?? [];
      current.push(option.id);
      correctOptions.set(option.question_id, current);
    }
  }

  let score = 0;
  let totalPoints = 0;
  let correctCount = 0;
  const results: QuizGradeResult["questions"] = [];

  for (const quizQuestion of quizQuestions) {
    const correctOptionIds = correctOptions.get(quizQuestion.question_id) ?? [];
    if (correctOptionIds.length === 0 || !explanations.has(quizQuestion.question_id)) {
      continue;
    }

    const submitted = body.answers[quizQuestion.question_id];
    const selectedOptionIds = Array.from(
      new Set(typeof submitted === "string" ? [submitted] : (submitted ?? [])),
    ).sort();
    const sortedCorrectIds = [...correctOptionIds].sort();
    const isCorrect =
      selectedOptionIds.length === sortedCorrectIds.length &&
      selectedOptionIds.every((optionId, index) => optionId === sortedCorrectIds[index]);
    const points = Number(quizQuestion.points);

    totalPoints += points;
    if (isCorrect) {
      correctCount += 1;
      score += points;
    }
    results.push({
      questionId: quizQuestion.question_id,
      isCorrect,
      correctOptionIds: sortedCorrectIds,
      explanation: explanations.get(quizQuestion.question_id) ?? null,
    });
  }

  const response: QuizGradeResult = {
    score: Number(score.toFixed(2)),
    totalPoints: Number(totalPoints.toFixed(2)),
    correctCount,
    questionCount: results.length,
    questions: results,
  };

  return Response.json(response);
}
