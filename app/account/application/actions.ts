"use server";
import { createClient } from "@/lib/supabase/server";

export type BusinessBasics = { versionId: string; businessName: string; shortSummary: string; fullDescription: string };
export type SaveResult = { ok: true } | { ok: false; message: string };

export async function saveBusinessBasics(input: BusinessBasics): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId)) return { ok: false, message: "This draft could not be identified." };
  const values = {
    business_name: input.businessName.trim(),
    short_summary: input.shortSummary.trim(),
    full_description: input.fullDescription.trim(),
  };
  if (values.business_name.length > 160 || values.short_summary.length > 160 || values.full_description.length > 2000) {
    return { ok: false, message: "One or more fields is too long." };
  }
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { data, error } = await supabase.from("listing_versions").update(values)
    .eq("id", input.versionId).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "We couldn’t save your changes. Please try again." };
  return { ok: true };
}
