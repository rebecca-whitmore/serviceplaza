import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import styles from "../auth.module.css";
import { signOut } from "./actions";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  return (
    <main className={styles.main}>
      <section className={styles.card} aria-labelledby="account-title">
        <p className={styles.eyebrow}>Business account</p>
        <h1 id="account-title">You’re signed in</h1>
        <p className={styles.intro}>
          {email ? `Signed in as ${email}.` : "Your secure session is active."}
        </p>
        <p className={styles.note}>
          Saved applications and listing management will appear here in a later
          step.
        </p>
        <form action={signOut}>
          <button className={styles.secondaryButton} type="submit">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
