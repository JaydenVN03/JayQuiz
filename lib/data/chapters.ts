import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicChapter } from "@/lib/supabase/database.types";

export async function listPublishedChapters(
  subjectSlug?: string,
): Promise<PublicChapter[]> {
  let query = createSupabaseServerClient()
    .from("public_chapters")
    .select("*");

  if (subjectSlug) {
    query = query.eq("subject_slug", subjectSlug);
  }

  const { data, error } = await query
    .order("sort_order")
    .order("title");

  if (error) {
    throw new Error("Failed to load published chapters.", { cause: error });
  }

  return data;
}

export async function getPublishedChapterBySlug(
  subjectSlug: string,
  chapterSlug: string,
): Promise<PublicChapter | null> {
  const { data, error } = await createSupabaseServerClient()
    .from("public_chapters")
    .select("*")
    .eq("subject_slug", subjectSlug)
    .eq("slug", chapterSlug)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load chapter "${chapterSlug}" for subject "${subjectSlug}".`,
      { cause: error },
    );
  }

  return data;
}
