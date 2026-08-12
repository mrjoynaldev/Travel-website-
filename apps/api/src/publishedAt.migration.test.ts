import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("published timestamp database guard", () => {
  it("installs a before-update trigger that rejects later published_at changes", () => {
    const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260812214000_make_published_at_immutable.sql"), "utf8");

    expect(migration).toContain("prevent_published_at_mutation");
    expect(migration).toContain("before update on public.posts");
    expect(migration).toContain("published_at is immutable after first publication");
  });
});
