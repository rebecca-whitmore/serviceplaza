"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (signInError) {
      setError("We couldn’t send your secure sign-in link. Please try again.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/login/check-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className={styles.main}>
      <section className={styles.card} aria-labelledby="login-title">
        <Link className={styles.backLink} href="/">
          ← Service Plaza
        </Link>
        <p className={styles.eyebrow}>Business access</p>
        <h1 id="login-title">Sign in securely</h1>
        <p className={styles.intro}>
          Enter your email and we’ll send you a one-time sign-in link. There’s
          no password to remember.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            autoComplete="email"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending…" : "Email me a secure link"}
          </button>
        </form>
      </section>
    </main>
  );
}
