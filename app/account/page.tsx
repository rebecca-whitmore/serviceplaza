import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import styles from "../auth.module.css";
import { signOut, startApplication } from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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

  let activeVersion: { id: string; status: string } | null = null;

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
        .in("status", ["draft", "pending", "changes_requested"])
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      activeVersion = version;
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
            : "Create or continue your Service Plaza business listing."}
        </p>
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
