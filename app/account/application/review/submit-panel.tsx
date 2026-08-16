"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitApplication } from "../actions";
import styles from "../application.module.css";

export function SubmitPanel({ versionId, ready }: { versionId: string; ready: boolean }) {
  const router = useRouter(); const [accepted, setAccepted] = useState(false); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("");
  async function submit() {
    if (!ready || !accepted || !window.confirm("Submit your application for review? You won’t be able to edit this draft while it is awaiting a decision.")) return;
    setSubmitting(true); setError(""); const result = await submitApplication(versionId, accepted);
    if (!result.ok) { setError(result.message); setSubmitting(false); return; }
    router.push("/account"); router.refresh();
  }
  return <section className={styles.submitCard}>
    <div><h2>Ready to submit?</h2><p>{ready ? "Your application contains everything required for review." : "Complete the items marked above before submitting."}</p></div>
    <label className={styles.declaration}><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span><strong>I confirm that the information provided is accurate.</strong><small>I understand Service Plaza will review this application before publication and that acceptance does not represent an endorsement of the business or its services.<br />You will receive an email when your application has been updated.</small></span></label>
    {error ? <p className={styles.submitError} role="alert">{error}</p> : null}
    <div className={styles.formNavigation}><Link className={styles.secondaryLink} href="/account/application/stand-out">Back</Link><button className={styles.submitButton} type="button" disabled={!ready || !accepted || submitting} onClick={() => void submit()}>{submitting ? "Submitting…" : "Submit for review"}</button></div>
  </section>;
}
