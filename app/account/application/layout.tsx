import { ApplicationShell } from "./application-shell";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", data.claims.sub).maybeSingle();
  const { data: listing } = business ? await supabase.from("listings").select("id").eq("business_id", business.id).maybeSingle() : { data: null };
  const { data: draft } = listing ? await supabase.from("listing_versions").select("supersedes_version_id").eq("listing_id", listing.id).eq("status", "draft").maybeSingle() : { data: null };
  const { data: reviewEvent } = draft?.supersedes_version_id ? await supabase.from("business_review_events").select("applicant_message").eq("listing_version_id", draft.supersedes_version_id).eq("event_type", "changes_requested").order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null };
  return <ApplicationShell changeRequestMessage={reviewEvent?.applicant_message}>{children}</ApplicationShell>;
}
