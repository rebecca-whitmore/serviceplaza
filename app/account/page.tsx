import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import styles from "../auth.module.css";
import { signOut, startApplication, startListingEdit } from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  const userId = typeof data.claims.sub === "string" ? data.claims.sub : null;
  const { data: business } = userId
    ? await supabase
        .from("businesses")
        .select("id, contact_name")
        .eq("owner_user_id", userId)
        .maybeSingle()
    : { data: null };
  const { data: profile } = userId
    ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    : { data: null };

  let activeVersion: { id: string; status: string } | null = null;
  let outcome: { event_type: string | null; applicant_message: string | null } | null = null;

  if (business) {
    const { data: listing } = await supabase
      .from("listings")
      .select("id")
      .eq("business_id", business.id)
      .maybeSingle();

    if (listing) {
      const { data: version } = await supabase
        .from("listing_versions")
        .select("id, status")
        .eq("listing_id", listing.id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      activeVersion = version;
      if (version?.status === "approved" || version?.status === "declined") {
        const { data: reviewOutcome } = await supabase
          .from("business_review_events")
          .select("event_type, applicant_message")
          .eq("listing_version_id", version.id)
          .eq("event_type", version.status)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        outcome = reviewOutcome;
      }
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.card} aria-labelledby="account-title">
        <p className={styles.eyebrow}>Business account</p>
        <h1 id="account-title">You’re signed in</h1>
        <p className={styles.intro}>
          {email ? `Signed in as ${email}.` : "Your secure session is active."}
        </p>
        <p className={styles.note}>
          {activeVersion?.status === "pending"
            ? "Your application is awaiting review."
            : activeVersion?.status === "approved"
              ? "Your application has been approved."
              : activeVersion?.status === "declined"
                ? "Your application review is complete."
                : "Create or continue your Service Plaza business listing."}
        </p>
        {outcome ? <aside className={`${styles.outcome} ${outcome.event_type === "approved" ? styles.outcomeApproved : styles.outcomeDeclined}`}><strong>{outcome.event_type === "approved" ? "Application approved" : "Application not approved"}</strong>{outcome.applicant_message ? <p>{outcome.applicant_message}</p> : null}</aside> : null}
        {activeVersion?.status === "approved" ? <form action={startListingEdit}><button className={styles.primaryButton} type="submit">Edit your listing</button></form> : null}
        {params.notice === "admin_required" ? <p className={styles.error}>That area is restricted to Service Plaza administrators.</p> : null}
        {params.error === "start_listing_edit" ? <p className={styles.error}>We couldn’t prepare your listing for editing. Your published listing has not been changed.</p> : null}
        {profile?.role === "admin" ? <Link className={styles.primaryLink} href="/admin">Open administrator review queue</Link> : null}
        {activeVersion?.status === "draft" ||
        activeVersion?.status === "changes_requested" ? (
          <Link className={styles.primaryLink} href="/account/application/basic-information">
            {activeVersion.status === "changes_requested"
              ? "Update requested changes"
              : "Continue application"}
          </Link>
        ) : null}
        {!activeVersion ? (
          <form className={styles.form} action={startApplication}>
            <label htmlFor="contactName">Your name</label>
            <input
              defaultValue={business?.contact_name ?? ""}
              id="contactName"
              maxLength={120}
              name="contactName"
              required
              type="text"
            />
            {params.error ? (
              <p className={styles.error}>
                We couldn’t start your application. Please check your name and
                try again.
              </p>
            ) : null}
            <button type="submit">Start your application</button>
          </form>
        ) : null}
        <form action={signOut}>
          <button className={styles.secondaryButton} type="submit">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
