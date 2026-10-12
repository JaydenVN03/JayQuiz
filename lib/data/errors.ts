function hasErrorCode(
  value: unknown,
  code: string,
): boolean {
  if (typeof value !== "object" || value === null) return false;
  return "code" in value && value.code === code;
}

export function isSupabaseSchemaNotReady(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (hasErrorCode(current, "PGRST205")) return true;
    current =
      current instanceof Error
        ? current.cause
        : typeof current === "object" && current !== null && "cause" in current
          ? current.cause
          : undefined;
    if (current === undefined) return false;
  }
  return false;
}
