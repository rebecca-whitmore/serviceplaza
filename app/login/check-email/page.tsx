import Link from "next/link";

import styles from "../../auth.module.css";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className={styles.main}>
      <section className={styles.card} aria-labelledby="check-email-title">
        <p className={styles.eyebrow}>Check your inbox</p>
        <h1 id="check-email-title">Your secure link is on its way</h1>
        <p className={styles.intro}>
          We sent a one-time sign-in link{email ? ` to ${email}` : ""}. Open it
          in this browser to continue.
        </p>
        <p className={styles.note}>
          If it doesn’t arrive, check your spam folder or return to sign in and
          try again.
        </p>
        <Link className={styles.textLink} href="/login">
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
