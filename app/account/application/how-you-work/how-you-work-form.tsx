"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveHowYouWork, type HowYouWork } from "../actions";
import styles from "../application.module.css";

type Values = Omit<HowYouWork, "versionId">;

export function HowYouWorkForm({ versionId, initialValues }: { versionId: string; initialValues: Values }) {
  const router = useRouter(); const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState("Your progress is saved privately."); const [hasError, setHasError] = useState(false);
  const changed = useRef(false); const latest = useRef(values); const chain = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { latest.current = values; }, [values]);
  const queueSave = useCallback((snapshot: Values, continueAfter = false) => {
    setStatus("Saving…"); setHasError(false);
    chain.current = chain.current.then(async () => {
      const result = await saveHowYouWork({ versionId, ...snapshot }, continueAfter).catch(() => ({ ok: false as const, message: "We couldn’t save your changes. Please try again." }));
      if (!continueAfter && JSON.stringify(snapshot) !== JSON.stringify(latest.current)) return;
      setHasError(!result.ok); setStatus(result.ok ? "All changes saved." : result.message);
      if (result.ok && continueAfter) router.push("/account/application/stand-out");
    });
  }, [router, versionId]);
  useEffect(() => { if (!changed.current) return; const timer = window.setTimeout(() => queueSave(values), 900); return () => window.clearTimeout(timer); }, [queueSave, values]);
  function update(patch: Partial<Values>) { changed.current = true; setStatus("Unsaved changes"); setHasError(false); setValues((current) => ({ ...current, ...patch })); }

  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); queueSave(latest.current, true); }}>
    <fieldset className={styles.fieldset}><legend>UK business eligibility</legend><p className={styles.hint}>Service Plaza is exclusively for businesses based in the United Kingdom.</p><label className={`${styles.optionCard} ${values.isUkBased ? styles.optionCardSelected : ""}`}><input type="checkbox" checked={values.isUkBased} onChange={(event) => update({ isUkBased: event.target.checked })}/><span><strong>I confirm that this business is based in the UK</strong><small>This confirmation is required before an application can be submitted.</small></span></label></fieldset>

    <fieldset className={styles.fieldset}><legend>How do you work with customers?</legend><p className={styles.hint}>Select both if customers can choose between them.</p><div className={styles.optionGrid}>
      <label className={`${styles.optionCard} ${values.offersOnline ? styles.optionCardSelected : ""}`}><input type="checkbox" checked={values.offersOnline} onChange={(event) => update({ offersOnline: event.target.checked })} /><span><strong>Online</strong><small>Services are delivered remotely, such as by video call, telephone or online systems.</small></span></label>
      <label className={`${styles.optionCard} ${values.offersInPerson ? styles.optionCardSelected : ""}`}><input type="checkbox" checked={values.offersInPerson} onChange={(event) => update({ offersInPerson: event.target.checked, ...(!event.target.checked ? { baseTownCity: "", ukRegion: "" } : {}) })} /><span><strong>In person</strong><small>You meet or work with customers face to face.</small></span></label>
    </div></fieldset>

    {values.offersInPerson ? <fieldset className={styles.fieldset}><legend>Where do you work in person?</legend><p className={styles.hint}>Enter your base town or city, your county or region, or both. You do not need to provide a street address. The location you enter will be shown on your public listing.</p><div className={styles.locationBox}><div className={styles.field}><div className={styles.labelRow}><label htmlFor="baseTownCity">Base town or city <span className={styles.optional}>(optional)</span></label><span>{values.baseTownCity.length}/120</span></div><input id="baseTownCity" autoComplete="address-level2" maxLength={120} value={values.baseTownCity} onChange={(event) => update({ baseTownCity: event.target.value })}/></div><div className={styles.field}><div className={styles.labelRow}><label htmlFor="ukRegion">County or region <span className={styles.optional}>(optional)</span></label><span>{values.ukRegion.length}/120</span></div><input id="ukRegion" autoComplete="address-level1" maxLength={120} value={values.ukRegion} onChange={(event) => update({ ukRegion: event.target.value })}/></div></div><p className={styles.hint}><strong>You must complete at least one of these two location fields.</strong></p></fieldset> : null}

    <div className={styles.saveBar}><p aria-live="polite" className={hasError ? styles.error : ""}>{status}</p><div className={styles.saveActions}><Link className={styles.secondaryLink} href="/account/application/about-business">Back</Link><button className={styles.saveOnly} type="button" onClick={() => queueSave(latest.current)}>Save draft</button><button type="submit">Save and continue</button></div></div>
  </form>;
}
