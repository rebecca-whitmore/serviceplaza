"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveAboutBusiness, type AboutBusiness } from "../actions";
import styles from "../application.module.css";

type Values = Omit<AboutBusiness, "versionId">;

export function AboutBusinessForm({ versionId, initialValues, aiPrompt }: { versionId: string; initialValues: Values; aiPrompt: string }) {
  const router = useRouter(); const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState("Your progress is saved privately."); const [hasError, setHasError] = useState(false); const [copyStatus, setCopyStatus] = useState("Copy prompt");
  const changed = useRef(false); const latest = useRef(values); const chain = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { latest.current = values; }, [values]);
  const queueSave = useCallback((snapshot: Values, continueAfter = false) => {
    setStatus("Saving…"); setHasError(false);
    chain.current = chain.current.then(async () => {
      const result = await saveAboutBusiness({ versionId, ...snapshot }, continueAfter).catch(() => ({ ok: false as const, message: "We couldn’t save your changes. Please try again." }));
      if (!continueAfter && JSON.stringify(snapshot) !== JSON.stringify(latest.current)) return;
      setHasError(!result.ok); setStatus(result.ok ? "All changes saved." : result.message);
      if (result.ok && continueAfter) router.push("/account/application/how-you-work");
    });
  }, [router, versionId]);
  useEffect(() => {
    if (!changed.current) return;
    const timer = window.setTimeout(() => queueSave(values), 900); return () => window.clearTimeout(timer);
  }, [queueSave, values]);
  function update(field: keyof Values, value: string) { changed.current = true; setStatus("Unsaved changes"); setHasError(false); setValues((current) => ({ ...current, [field]: value })); }
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(aiPrompt); setCopyStatus("Prompt copied"); window.setTimeout(() => setCopyStatus("Copy prompt"), 2500); }
    catch { setCopyStatus("Select and copy the prompt below"); }
  }

  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); queueSave(latest.current, true); }}>
    <aside className={styles.aiHelper}><strong className={styles.aiHelperTitle}>Not sure where to begin?</strong><p>Think about your ideal customer, the problem they need solved, how your service helps and the experience you provide.</p><details className={styles.aiPromptDisclosure}><summary><strong>If you use AI and would like some support, click to open an optional prompt.</strong></summary><div className={styles.aiHelperContent}><p>Copy this prompt into the AI tool you already use. It will ask about your business before suggesting both pieces of copy.</p><p className={styles.aiCaution}>Always check AI-generated wording carefully and make sure every statement is accurate before adding it to your listing.</p><button type="button" onClick={() => void copyPrompt()}>{copyStatus}</button><pre tabIndex={0}>{aiPrompt}</pre></div></details></aside>
    <div className={styles.field}><div className={styles.labelRow}><label htmlFor="shortSummary">Short summary</label><span>{values.shortSummary.length}/160</span></div><p className={styles.hint}>In one clear sentence, say who you help and what you help them with. This will introduce your business in search and browsing results.</p><textarea id="shortSummary" rows={3} maxLength={160} value={values.shortSummary} onChange={(event) => update("shortSummary", event.target.value)} placeholder="For example, I help independent businesses save time through reliable virtual assistance and practical operations support." /></div>
    <div className={styles.field}><div className={styles.labelRow}><label htmlFor="fullDescription">Full business description</label><span>{values.fullDescription.length}/2,000</span></div><p className={styles.hint}>Tell visitors who you support, what they can expect from working with you and what makes your approach a good fit. <strong>Write at least 100 characters.</strong></p><textarea id="fullDescription" rows={12} minLength={100} maxLength={2000} value={values.fullDescription} onChange={(event) => update("fullDescription", event.target.value)} placeholder="Share the useful details a prospective customer would want to know before getting in touch." /></div>
    <div className={styles.saveBar}><p aria-live="polite" className={hasError ? styles.error : ""}>{status}</p><div className={styles.saveActions}><Link className={styles.secondaryLink} href="/account/application/contact-details">Back</Link><button className={styles.saveOnly} type="button" onClick={() => queueSave(latest.current)}>Save draft</button><button type="submit">Save and continue</button></div></div>
  </form>;
}
