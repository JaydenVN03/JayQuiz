import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PublicQuiz,
  PublicQuizContentRow,
} from "@/lib/supabase/database.types";

export type PublishedQuizQuestion = {
  id: string;
  content: string;
  type: PublicQuizContentRow["question_type"];
  difficulty: PublicQuizContentRow["difficulty"];
  points: number;
  options: Array<{ id: string; content: string }>;
};

export type PublishedQuiz = PublicQuiz & {
  questions: PublishedQuizQuestion[];
};

export type PublishedQuizFilters = {
  subjectSlug?: string;
  chapterSlug?: string;
};

export async function listPublishedQuizzes(
  filters: PublishedQuizFilters = {},
): Promise<PublicQuiz[]> {
  let query = createSupabaseServerClient()
    .from("public_quizzes")
    .select("*");

  if (filters.subjectSlug) {
    query = query.eq("subject_slug", filters.subjectSlug);
  }

  if (filters.chapterSlug) {
    query = query.eq("chapter_slug", filters.chapterSlug);
  }

  const { data, error } = await query
    .order("title");

  if (error) {
    throw new Error("Failed to load published quizzes.", { cause: error });
  }

  return data;
}

export async function getPublishedQuizBySlug(
  slug: string,
): Promise<PublishedQuiz | null> {
  const client = createSupabaseServerClient();
  const { data: quiz, error: quizError } = await client
    .from("public_quizzes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (quizError) {
    throw new Error(`Failed to load quiz "${slug}".`, { cause: quizError });
  }

  if (!quiz) {
    return null;
  }

  const { data: rows, error: contentError } = await client
    .from("public_quiz_content")
    .select("*")
    .eq("quiz_id", quiz.id)
    .order("question_sort_order")
    .order("option_sort_order");

  if (contentError) {
    throw new Error(`Failed to load content for quiz "${slug}".`, {
      cause: contentError,
    });
  }

  const questions = new Map<string, PublishedQuizQuestion>();
  for (const row of rows) {
    let question = questions.get(row.question_id);
    if (!question) {
      question = {
        id: row.question_id,
        content: row.question_content,
        type: row.question_type,
        difficulty: row.difficulty,
        points: row.points,
        options: [],
      };
      questions.set(row.question_id, question);
    }

    question.options.push({
      id: row.option_id,
      content: row.option_content,
    });
  }

  return { ...quiz, questions: Array.from(questions.values()) };
}
