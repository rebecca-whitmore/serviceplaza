"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveBusinessBasics, type BusinessBasics } from "./actions";
import styles from "./application.module.css";

type Values = Omit<BusinessBasics, "versionId">;
export function BusinessBasicsForm({ versionId, initialValues }: { versionId: string; initialValues: Values }) {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState("Your draft is saved privately.");
  const [hasError, setHasError] = useState(false);
  const changed = useRef(false);
  const latest = useRef(values);
  const chain = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { latest.current = values; }, [values]);

  const queueSave = useCallback((snapshot: Values) => {
    setStatus("Saving…"); setHasError(false);
    chain.current = chain.current.then(async () => {
      const result = await saveBusinessBasics({ versionId, ...snapshot }).catch(() => ({ ok: false as const, message: "We couldn’t save your changes. Please try again." }));
      if (JSON.stringify(snapshot) !== JSON.stringify(latest.current)) return;
      setHasError(!result.ok); setStatus(result.ok ? "All changes saved." : result.message);
    });
  }, [versionId]);

  useEffect(() => {
    if (!changed.current) return;
    const timer = window.setTimeout(() => queueSave(values), 900);
    return () => window.clearTimeout(timer);
  }, [queueSave, values]);

  function update(field: keyof Values, value: string) {
    changed.current = true; setStatus("Unsaved changes"); setHasError(false);
    setValues((current) => ({ ...current, [field]: value }));
  }

  return <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
    <Field id="businessName" label="Business name" count={`${values.businessName.length}/160`}><input id="businessName" autoComplete="organization" maxLength={160} value={values.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="The name customers know you by" /></Field>
    <Field id="shortSummary" label="Short summary" count={`${values.shortSummary.length}/160`} hint="In one sentence, explain who you help and what you help them with."><textarea id="shortSummary" maxLength={160} rows={3} value={values.shortSummary} onChange={(e) => update("shortSummary", e.target.value)} /></Field>
    <Field id="fullDescription" label="Full business description" count={`${values.fullDescription.length}/2,000`} hint="Tell visitors who you help, how you work and what makes your service a good fit. At least 100 characters will be required before submission."><textarea id="fullDescription" maxLength={2000} rows={10} value={values.fullDescription} onChange={(e) => update("fullDescription", e.target.value)} /></Field>
    <div className={styles.saveBar}><p aria-live="polite" className={hasError ? styles.error : ""}>{status}</p><button type="button" onClick={() => queueSave(latest.current)}>Save draft</button></div>
  </form>;
}

function Field({ id, label, count, hint, children }: { id: string; label: string; count: string; hint?: string; children: React.ReactNode }) {
  return <div className={styles.field}><div className={styles.labelRow}><label htmlFor={id}>{label}</label><span>{count}</span></div>{hint ? <p className={styles.hint}>{hint}</p> : null}{children}</div>;
}
