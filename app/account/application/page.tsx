import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import styles from "../../auth.module.css";

export default async function ApplicationPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_user_id", claimsData.claims.sub)
    .maybeSingle();

  if (!business) {
    redirect("/account");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("business_id", business.id)
    .maybeSingle();

  if (!listing) {
    redirect("/account");
  }

  const { data: draft } = await supabase
    .from("listing_versions")
    .select("id")
    .eq("listing_id", listing.id)
    .eq("status", "draft")
    .maybeSingle();

  if (!draft) {
    redirect("/account");
  }

  return (
    <main className={styles.main}>
      <section className={styles.card} aria-labelledby="application-title">
        <Link className={styles.backLink} href="/account">
          ← Business account
        </Link>
        <p className={styles.eyebrow}>Saved draft</p>
        <h1 id="application-title">Your application is ready</h1>
        <p className={styles.intro}>
          Your private draft has been created securely. We’ll add the first
          application section in the next development step.
        </p>
      </section>
    </main>
  );
}
