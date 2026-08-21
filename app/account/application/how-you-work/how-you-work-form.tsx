"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveHowYouWork, type HowYouWork } from "../actions";
import styles from "../application.module.css";
import { COVERAGE_MILES } from "@/lib/uk-postcodes";

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
      <label className={`${styles.optionCard} ${values.offersInPerson ? styles.optionCardSelected : ""}`}><input type="checkbox" checked={values.offersInPerson} onChange={(event) => update({ offersInPerson: event.target.checked, ...(!event.target.checked ? { businessPostcode: "", baseTownCity: "", ukRegion: "", inPersonMode: "", inPersonNationwide: false } : {}) })} /><span><strong>In person</strong><small>You meet or work with customers face to face.</small></span></label>
    </div></fieldset>

    {values.offersInPerson ? <fieldset className={styles.fieldset}><legend>How do customers work with you in person?</legend><p className={styles.hint}>This helps us show your business to customers whose location you genuinely cover.</p><div className={styles.optionGrid}>{([
      ["travels_to_customer", "I travel to customers", "Customers book you to work at their location."],
      ["customers_visit", "Customers visit me", "Customers travel to your studio, clinic, shop or other premises."],
      ["both", "Both", "Customers can visit you and you also travel to them."],
    ] as const).map(([mode,title,copy]) => <label className={`${styles.optionCard} ${values.inPersonMode === mode ? styles.optionCardSelected : ""}`} key={mode}><input type="radio" name="inPersonMode" checked={values.inPersonMode === mode} onChange={() => update({ inPersonMode: mode, inPersonNationwide: mode === "customers_visit" ? false : values.inPersonNationwide })}/><span><strong>{title}</strong><small>{copy}</small></span></label>)}</div>
      <div className={styles.locationBox}><div className={styles.field}><label htmlFor="businessPostcode">Business or service-base postcode</label><p className={styles.hint}>Your full postcode is kept private. Visitors will only see a broader area.</p><input id="businessPostcode" autoComplete="postal-code" maxLength={8} value={values.businessPostcode} onChange={(event) => update({ businessPostcode: event.target.value.toUpperCase() })} placeholder="For example, CH1 2AB"/></div>
      {values.inPersonMode && values.inPersonMode !== "customers_visit" ? <><div className={styles.field}><label htmlFor="travelRadiusMiles">How far do you travel?</label><select id="travelRadiusMiles" value={values.travelRadiusMiles} disabled={values.inPersonNationwide} onChange={(event) => update({ travelRadiusMiles: Number(event.target.value) })}>{COVERAGE_MILES.map((miles) => <option value={miles} key={miles}>{miles} {miles === 1 ? "mile" : "miles"}</option>)}</select></div><label className={styles.checkChoice}><input type="checkbox" checked={values.inPersonNationwide} onChange={(event) => update({ inPersonNationwide: event.target.checked })}/><span><strong>I serve customers nationwide</strong><small>Choose this only if you genuinely travel throughout the UK.</small></span></label></> : null}</div>
      <p className={styles.hint}>We use the postcode to calculate distance. It will not be displayed as your public address.</p>
    </fieldset> : null}

    <div className={styles.saveBar}><p aria-live="polite" className={hasError ? styles.error : ""}>{status}</p><div className={styles.saveActions}><Link className={styles.secondaryLink} href="/account/application/about-business">Back</Link><button className={styles.saveOnly} type="button" onClick={() => queueSave(latest.current)}>Save draft</button><button type="submit">Save and continue</button></div></div>
  </form>;
}
