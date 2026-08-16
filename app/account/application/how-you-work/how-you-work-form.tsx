"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveHowYouWork, type HowYouWork } from "../actions";
import styles from "../application.module.css";

type Values = Omit<HowYouWork, "versionId">;
const regions = ["East Midlands", "East of England", "London", "North East England", "North West England", "South East England", "South West England", "West Midlands", "Yorkshire and the Humber", "Scotland", "Wales", "Northern Ireland"];

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
    <fieldset className={styles.fieldset}><legend>How do you work with customers?</legend><p className={styles.hint}>Select both if customers can choose between them.</p><div className={styles.optionGrid}>
      <label className={`${styles.optionCard} ${values.offersOnline ? styles.optionCardSelected : ""}`}><input type="checkbox" checked={values.offersOnline} onChange={(event) => update({ offersOnline: event.target.checked })} /><span><strong>Online</strong><small>Services are delivered remotely, such as by video call, telephone or online systems.</small></span></label>
      <label className={`${styles.optionCard} ${values.offersInPerson ? styles.optionCardSelected : ""}`}><input type="checkbox" checked={values.offersInPerson} onChange={(event) => update({ offersInPerson: event.target.checked })} /><span><strong>In person</strong><small>You meet or work with customers face to face.</small></span></label>
    </div></fieldset>

    <fieldset className={styles.fieldset}><legend>Where do you serve customers?</legend><p className={styles.hint}>Select both if you work locally and also accept customers from across the UK.</p><div className={styles.optionGrid}>
      <label className={`${styles.optionCard} ${values.servesLocal ? styles.optionCardSelected : ""}`}><input type="checkbox" checked={values.servesLocal} onChange={(event) => update({ servesLocal: event.target.checked, ...(!event.target.checked ? { baseTownCity: "", ukRegion: "" } : {}) })} /><span><strong>My local area</strong><small>Your town or city and region will help nearby customers find you.</small></span></label>
      <label className={`${styles.optionCard} ${values.servesUkWide ? styles.optionCardSelected : ""}`}><input type="checkbox" checked={values.servesUkWide} onChange={(event) => update({ servesUkWide: event.target.checked })} /><span><strong>Across the UK</strong><small>You welcome customers from anywhere in the United Kingdom.</small></span></label>
    </div></fieldset>

    {values.servesLocal ? <div className={styles.locationBox}><div className={styles.field}><div className={styles.labelRow}><label htmlFor="baseTownCity">Base town or city</label><span>{values.baseTownCity.length}/120</span></div><p className={styles.hint}>Your full address is not required.</p><input id="baseTownCity" autoComplete="address-level2" maxLength={120} value={values.baseTownCity} onChange={(event) => update({ baseTownCity: event.target.value })} /></div>
      <div className={styles.field}><label htmlFor="ukRegion">UK region</label><select id="ukRegion" value={values.ukRegion} onChange={(event) => update({ ukRegion: event.target.value })}><option value="">Select your region</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></div></div> : null}

    <div className={styles.saveBar}><p aria-live="polite" className={hasError ? styles.error : ""}>{status}</p><div className={styles.saveActions}><Link className={styles.secondaryLink} href="/account/application/about-business">Back</Link><button className={styles.saveOnly} type="button" onClick={() => queueSave(latest.current)}>Save draft</button><button type="submit">Save and continue</button></div></div>
  </form>;
}
