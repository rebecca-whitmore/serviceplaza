import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AboutBusinessForm } from "./about-business-form";
import { aiListingPrompt } from "@/lib/data/ai-listing-prompt";
import styles from "../application.module.css";

export default async function AboutBusinessPage() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getClaims();
  if (error || !auth?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", auth.claims.sub).maybeSingle();
  if (!business) redirect("/account");
  const { data: listing } = await supabase.from("listings").select("id").eq("business_id", business.id).maybeSingle();
  if (!listing) redirect("/account");
  const { data: draft } = await supabase.from("listing_versions").select("id, short_summary, full_description").eq("listing_id", listing.id).eq("status", "draft").maybeSingle();
  if (!draft) redirect("/account");

  return <><header className={styles.header}><div><h1>About your business</h1></div></header>
    <p className={styles.intro}>Give prospective customers a clear, welcoming introduction to your business and the value you provide.</p>
    <AboutBusinessForm versionId={draft.id} aiPrompt={aiListingPrompt} initialValues={{ shortSummary: draft.short_summary, fullDescription: draft.full_description }} />
  </>;
}
