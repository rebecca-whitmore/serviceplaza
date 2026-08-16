"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBasicInformation, type BasicInformation } from "../actions";
import styles from "../application.module.css";

type Values = Omit<BasicInformation, "versionId">;
type Category = { id: string; name: string; description: string };
type ServiceTag = { id: string; categoryId: string; name: string };

export function BasicInformationForm({ versionId, categories, serviceTags, initialValues }: {
  versionId: string; categories: Category[]; serviceTags: ServiceTag[]; initialValues: Values;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [newService, setNewService] = useState("");
  const [status, setStatus] = useState("Your progress is saved privately.");
  const [hasError, setHasError] = useState(false);
  const changed = useRef(false); const latest = useRef(values); const chain = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { latest.current = values; }, [values]);

  const queueSave = useCallback((snapshot: Values, continueAfter = false) => {
    setStatus("Saving…"); setHasError(false);
    chain.current = chain.current.then(async () => {
      const result = await saveBasicInformation({ versionId, ...snapshot }).catch(() => ({ ok: false as const, message: "We couldn’t save your changes. Please try again." }));
      if (!continueAfter && JSON.stringify(snapshot) !== JSON.stringify(latest.current)) return;
      setHasError(!result.ok); setStatus(result.ok ? "All changes saved." : result.message);
      if (result.ok && continueAfter) router.push("/account/application/contact-details");
    });
  }, [router, versionId]);
  useEffect(() => {
    if (!changed.current || !values.applicantName.trim() || !values.businessName.trim() || (!values.categoryHelpRequested && !values.primaryCategoryId) || (values.categoryHelpRequested && !values.categoryHelpText.trim())) return;
    const timer = window.setTimeout(() => queueSave(values), 900); return () => window.clearTimeout(timer);
  }, [queueSave, values]);

  function update(patch: Partial<Values>) { changed.current = true; setStatus("Unsaved changes"); setHasError(false); setValues((current) => ({ ...current, ...patch })); }
  function selectPrimary(id: string) {
    const additional = values.additionalCategoryIds.filter((categoryId) => categoryId !== id);
    keepValidTags(id, additional, { primaryCategoryId: id, additionalCategoryIds: additional, categoryHelpRequested: false, categoryHelpText: "" });
  }
  function setAdditional(index: number, id: string) {
    const additional = [...values.additionalCategoryIds];
    if (id) additional[index] = id; else additional.splice(index, 1);
    const unique = additional.filter((value, itemIndex, all) => value && value !== values.primaryCategoryId && all.indexOf(value) === itemIndex).slice(0, 2);
    keepValidTags(values.primaryCategoryId, unique, { additionalCategoryIds: unique });
  }
  function keepValidTags(primary: string | null, additional: string[], patch: Partial<Values>) {
    const categoryIds = new Set([primary, ...additional]);
    update({ ...patch, serviceTagIds: values.serviceTagIds.filter((id) => categoryIds.has(serviceTags.find((tag) => tag.id === id)?.categoryId ?? null)) });
  }
  function toggleHelp(checked: boolean) {
    update(checked ? { categoryHelpRequested: true, primaryCategoryId: null, additionalCategoryIds: [], serviceTagIds: [] } : { categoryHelpRequested: false, categoryHelpText: "" });
  }
  function toggleTag(id: string) {
    const selected = values.serviceTagIds.includes(id); if (!selected && values.serviceTagIds.length >= 8) return;
    update({ serviceTagIds: selected ? values.serviceTagIds.filter((tagId) => tagId !== id) : [...values.serviceTagIds, id] });
  }
  function addService() {
    const name = newService.trim(); if (!name || values.customServices.length >= 15) return;
    update({ customServices: [...values.customServices, name] }); setNewService("");
  }

  const primary = categories.find((category) => category.id === values.primaryCategoryId);
  const selectedCategoryIds = useMemo(() => new Set([values.primaryCategoryId, ...values.additionalCategoryIds]), [values.primaryCategoryId, values.additionalCategoryIds]);
  const availableTags = serviceTags.filter((tag) => selectedCategoryIds.has(tag.categoryId));
  const categoryOptions = (exclude: string[]) => categories.filter((category) => !exclude.includes(category.id));

  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); queueSave(latest.current, true); }}>
    <div className={styles.field}><label htmlFor="applicantName">Your name</label><p className={styles.hint}>This is for your Service Plaza account and won’t automatically appear publicly.</p><input id="applicantName" autoComplete="name" maxLength={120} value={values.applicantName} onChange={(event) => update({ applicantName: event.target.value })} required /></div>
    <div className={styles.field}><div className={styles.labelRow}><label htmlFor="businessName">Business name</label><span>{values.businessName.length}/160</span></div><input id="businessName" autoComplete="organization" maxLength={160} value={values.businessName} onChange={(event) => update({ businessName: event.target.value })} required /></div>

    <div className={styles.formDivider} />
    <div className={styles.field}><label htmlFor="primaryCategory">Primary category</label><p className={styles.hint}>Choose the category that best represents your main service.</p>
      <select id="primaryCategory" value={values.primaryCategoryId ?? ""} disabled={values.categoryHelpRequested} onChange={(event) => selectPrimary(event.target.value)}><option value="">Select a category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>
      {primary ? <p className={styles.selectionNote}>{primary.description}</p> : null}
    </div>
    <div className={styles.helpBox}><label className={styles.helpToggle}><input type="checkbox" checked={values.categoryHelpRequested} onChange={(event) => toggleHelp(event.target.checked)} /><span><strong>I can’t find the right category</strong><small>Selecting this clears any category and service-tag choices. Tell us what you need and we’ll review it.</small></span></label>
      {values.categoryHelpRequested ? <div className={styles.field}><div className={styles.labelRow}><label htmlFor="categoryHelpText">Describe your service</label><span>{values.categoryHelpText.length}/1,000</span></div><textarea id="categoryHelpText" rows={4} maxLength={1000} value={values.categoryHelpText} onChange={(event) => update({ categoryHelpText: event.target.value })} required /></div> : null}
    </div>

    {values.primaryCategoryId && !values.categoryHelpRequested ? <>
      <fieldset className={styles.fieldset}><legend>Additional categories <span>(optional)</span></legend><p className={styles.hint}>Choose up to two only where they are an important part of your work.</p><div className={styles.selectGrid}>
        <label>Additional category 1<select value={values.additionalCategoryIds[0] ?? ""} onChange={(event) => setAdditional(0, event.target.value)}><option value="">None</option>{categoryOptions([values.primaryCategoryId, values.additionalCategoryIds[1]]).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
        <label>Additional category 2<select value={values.additionalCategoryIds[1] ?? ""} onChange={(event) => setAdditional(1, event.target.value)}><option value="">None</option>{categoryOptions([values.primaryCategoryId, values.additionalCategoryIds[0]]).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      </div></fieldset>
      <fieldset className={styles.fieldset}><legend>Service tags <span>({values.serviceTagIds.length}/8)</span></legend><p className={styles.hint}>Select the specific services that describe your work.</p><div className={styles.tagGrid}>{availableTags.map((tag) => <label className={`${styles.tagChoice} ${values.serviceTagIds.includes(tag.id) ? styles.tagChoiceSelected : ""}`} key={tag.id}><input type="checkbox" checked={values.serviceTagIds.includes(tag.id)} disabled={!values.serviceTagIds.includes(tag.id) && values.serviceTagIds.length >= 8} onChange={() => toggleTag(tag.id)} /><span>{tag.name}</span></label>)}</div></fieldset>
    </> : null}

    <div className={styles.field}><div className={styles.labelRow}><label htmlFor="newService">Services you offer</label><span>{values.customServices.length}/15</span></div><p className={styles.hint}>Add customer-friendly service names in your own words, one at a time.</p><div className={styles.addRow}><input id="newService" maxLength={80} value={newService} onChange={(event) => setNewService(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addService(); } }} placeholder="For example, Monthly social media support" /><button type="button" onClick={addService} disabled={!newService.trim() || values.customServices.length >= 15}>Add</button></div>
      {values.customServices.length ? <ul className={styles.serviceList}>{values.customServices.map((service, index) => <li key={`${service}-${index}`}><span>{service}</span><button type="button" onClick={() => update({ customServices: values.customServices.filter((_, i) => i !== index) })}>Remove</button></li>)}</ul> : null}
    </div>
    <div className={styles.saveBar}><p aria-live="polite" className={hasError ? styles.error : ""}>{status}</p><div className={styles.saveActions}><button className={styles.saveOnly} type="button" onClick={() => queueSave(latest.current)}>Save draft</button><button type="submit">Save and continue</button></div></div>
  </form>;
}
