import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function createSupabaseAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requiredEnvironmentVariable("SUPABASE_URL"),
    requiredEnvironmentVariable("SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

export async function requireAdmin() {
  const supabase = await createSupabaseAuthServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/admin/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("Không thể xác minh quyền quản trị.", { cause: profileError });
  }
  if (!profile) {
    redirect("/admin/login?reason=unauthorized");
  }

  return { supabase, user: userData.user };
}
