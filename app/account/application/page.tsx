import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessBasicsForm } from "./business-basics-form";
import styles from "./application.module.css";

export default async function ApplicationPage() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getClaims();
  if (error || !auth?.claims?.sub) redirect("/login");

  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", auth.claims.sub).maybeSingle();
  if (!business) redirect("/account");
  const { data: listing } = await supabase.from("listings").select("id").eq("business_id", business.id).maybeSingle();
  if (!listing) redirect("/account");
  const { data: draft } = await supabase.from("listing_versions")
    .select("id, business_name, short_summary, full_description")
    .eq("listing_id", listing.id).eq("status", "draft").maybeSingle();
  if (!draft) redirect("/account");

  return (
    <main className={styles.main}><div className={styles.shell}>
      <Link className={styles.backLink} href="/account">← Business account</Link>
      <header className={styles.header}><div><p className={styles.eyebrow}>Application · Section 1</p><h1>Tell us about your business</h1></div><p>1 of 1 currently available</p></header>
      <p className={styles.intro}>Start with the essentials visitors will use to understand your business. Your progress saves automatically and remains private until submission.</p>
      <BusinessBasicsForm versionId={draft.id} initialValues={{ businessName: draft.business_name, shortSummary: draft.short_summary, fullDescription: draft.full_description }} />
    </div></main>
  );
}
