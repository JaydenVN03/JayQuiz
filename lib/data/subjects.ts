import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicSubject } from "@/lib/supabase/database.types";

export async function listPublishedSubjects(): Promise<PublicSubject[]> {
  const { data, error } = await createSupabaseServerClient()
    .from("public_subjects")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) {
    throw new Error("Failed to load published subjects.", { cause: error });
  }

  return data;
}

export async function getPublishedSubjectBySlug(
  slug: string,
): Promise<PublicSubject | null> {
  const { data, error } = await createSupabaseServerClient()
    .from("public_subjects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load subject "${slug}".`, { cause: error });
  }

  return data;
}
