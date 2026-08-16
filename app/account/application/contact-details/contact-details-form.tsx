"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveContactDetails, type ContactDetails } from "../actions";
import styles from "../application.module.css";

type Values = Omit<ContactDetails, "versionId">;
const socialFields = [
  ["instagram", "Instagram"], ["facebook", "Facebook"], ["linkedin", "LinkedIn"],
  ["tiktok", "TikTok"], ["youtube", "YouTube"],
] as const;

export function ContactDetailsForm({ versionId, initialValues }: { versionId: string; initialValues: Values }) {
  const router = useRouter(); const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState("Your progress is saved privately."); const [hasError, setHasError] = useState(false);
  const changed = useRef(false); const latest = useRef(values); const chain = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { latest.current = values; }, [values]);
  const queueSave = useCallback((snapshot: Values, continueAfter = false) => {
    setStatus("Saving…"); setHasError(false);
    chain.current = chain.current.then(async () => {
      const result = await saveContactDetails({ versionId, ...snapshot }).catch(() => ({ ok: false as const, message: "We couldn’t save your changes. Please try again." }));
      if (!continueAfter && JSON.stringify(snapshot) !== JSON.stringify(latest.current)) return;
      setHasError(!result.ok); setStatus(result.ok ? "All changes saved." : result.message);
      if (result.ok && continueAfter) router.push("/account/application/about-business");
    });
  }, [router, versionId]);
  useEffect(() => {
    if (!changed.current || !values.publicContactName.trim()) return;
    const timer = window.setTimeout(() => queueSave(values), 900); return () => window.clearTimeout(timer);
  }, [queueSave, values]);
  function update(patch: Partial<Values>) { changed.current = true; setStatus("Unsaved changes"); setHasError(false); setValues((current) => ({ ...current, ...patch })); }
  function updateSocial(key: string, value: string) { update({ socialLinks: { ...values.socialLinks, [key]: value } }); }

  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); queueSave(latest.current, true); }}>
    <aside className={styles.infoBox}><strong>Listing Contact Information</strong><p>Your sign-in email remains private. All sections below are optional and if completed will be shown on your public listing.</p></aside>
    <div className={styles.field}><div className={styles.labelRow}><label htmlFor="publicContactName">Contact name shown on your listing</label><span>{values.publicContactName.length}/120</span></div><p className={styles.hint}>This could be your name, a team member’s name or a role such as “Client enquiries”.</p><input id="publicContactName" autoComplete="name" maxLength={120} value={values.publicContactName} onChange={(event) => update({ publicContactName: event.target.value })} required /></div>

    <div className={styles.field}><label htmlFor="publicEmail">Listing email address <span className={styles.optional}>(optional)</span></label><input id="publicEmail" type="email" autoComplete="email" maxLength={320} value={values.publicEmail} onChange={(event) => update({ publicEmail: event.target.value, showPublicEmail: Boolean(event.target.value.trim()) })} /></div>

    <div className={styles.field}><label htmlFor="publicPhone">Listing telephone number <span className={styles.optional}>(optional)</span></label><input id="publicPhone" type="tel" autoComplete="tel" maxLength={40} value={values.publicPhone} onChange={(event) => update({ publicPhone: event.target.value, showPublicPhone: Boolean(event.target.value.trim()) })} /></div>

    <div className={styles.formDivider} />
    <div className={styles.field}><label htmlFor="websiteUrl">Website <span className={styles.optional}>(optional)</span></label><p className={styles.hint}>Enter the complete address, including https://</p><input id="websiteUrl" type="url" inputMode="url" placeholder="https://yourbusiness.co.uk" value={values.websiteUrl} onChange={(event) => update({ websiteUrl: event.target.value })} /></div>
    <fieldset className={styles.fieldset}><legend>Social links <span>(optional)</span></legend><p className={styles.hint}>Only add profiles used by this business. Enter each complete link, including https://</p><div className={styles.socialGrid}>{socialFields.map(([key, label]) => <div className={styles.field} key={key}><label htmlFor={key}>{label}</label><input id={key} type="url" inputMode="url" value={values.socialLinks[key] ?? ""} onChange={(event) => updateSocial(key, event.target.value)} placeholder={`https://${key}.com/yourbusiness`} /></div>)}</div></fieldset>

    <div className={styles.saveBar}><p aria-live="polite" className={hasError ? styles.error : ""}>{status}</p><div className={styles.saveActions}><button className={styles.saveOnly} type="button" onClick={() => queueSave(latest.current)}>Save draft</button><button type="submit">Save and continue</button></div></div>
  </form>;
}
