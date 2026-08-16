"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveListingTaxonomy, type ListingTaxonomy } from "./actions";
import styles from "./application.module.css";

type Values = Omit<ListingTaxonomy, "versionId">;
type Category = { id: string; name: string; description: string };
type ServiceTag = { id: string; categoryId: string; name: string };

export function CategoryServicesForm({ versionId, categories, serviceTags, initialValues }: {
  versionId: string; categories: Category[]; serviceTags: ServiceTag[]; initialValues: Values;
}) {
  const [values, setValues] = useState(initialValues);
  const [newService, setNewService] = useState("");
  const [status, setStatus] = useState("Your category and services are saved privately.");
  const [hasError, setHasError] = useState(false);
  const changed = useRef(false);
  const latest = useRef(values);
  const chain = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { latest.current = values; }, [values]);

  const queueSave = useCallback((snapshot: Values) => {
    setStatus("Saving…"); setHasError(false);
    chain.current = chain.current.then(async () => {
      const result = await saveListingTaxonomy({ versionId, ...snapshot }).catch(() => ({ ok: false as const, message: "We couldn’t save your changes. Please try again." }));
      if (JSON.stringify(snapshot) !== JSON.stringify(latest.current)) return;
      setHasError(!result.ok); setStatus(result.ok ? "All changes saved." : result.message);
    });
  }, [versionId]);
  useEffect(() => {
    if (!changed.current) return;
    const timer = window.setTimeout(() => queueSave(values), 900);
    return () => window.clearTimeout(timer);
  }, [queueSave, values]);

  function update(next: Values) { changed.current = true; setStatus("Unsaved changes"); setHasError(false); setValues(next); }
  function choosePrimary(id: string) {
    const additionalCategoryIds = values.additionalCategoryIds.filter((categoryId) => categoryId !== id);
    const selectedCategories = new Set([id, ...additionalCategoryIds]);
    update({ ...values, primaryCategoryId: id, additionalCategoryIds, serviceTagIds: values.serviceTagIds.filter((tagId) => {
      const tag = serviceTags.find((item) => item.id === tagId); return Boolean(tag && selectedCategories.has(tag.categoryId));
    }) });
  }
  function toggleAdditional(id: string) {
    const exists = values.additionalCategoryIds.includes(id);
    if (!exists && values.additionalCategoryIds.length >= 2) return;
    const additionalCategoryIds = exists ? values.additionalCategoryIds.filter((item) => item !== id) : [...values.additionalCategoryIds, id];
    const selectedCategories = new Set([values.primaryCategoryId, ...additionalCategoryIds]);
    update({ ...values, additionalCategoryIds, serviceTagIds: values.serviceTagIds.filter((tagId) => {
      const tag = serviceTags.find((item) => item.id === tagId); return Boolean(tag && selectedCategories.has(tag.categoryId));
    }) });
  }
  function toggleTag(id: string) {
    const exists = values.serviceTagIds.includes(id); if (!exists && values.serviceTagIds.length >= 8) return;
    update({ ...values, serviceTagIds: exists ? values.serviceTagIds.filter((item) => item !== id) : [...values.serviceTagIds, id] });
  }
  function addService() {
    const service = newService.trim(); if (!service || values.customServices.length >= 15) return;
    update({ ...values, customServices: [...values.customServices, service] }); setNewService("");
  }

  const selectedCategoryIds = useMemo(() => new Set([values.primaryCategoryId, ...values.additionalCategoryIds]), [values.primaryCategoryId, values.additionalCategoryIds]);
  const availableTags = serviceTags.filter((tag) => selectedCategoryIds.has(tag.categoryId));

  return <section className={styles.section}>
    <div className={styles.sectionHeading}><p className={styles.eyebrow}>Application · Section 2</p><h2>Categories &amp; services</h2><p>Choose where visitors should find you, then describe the specific services you offer.</p></div>
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <fieldset className={styles.fieldset}><legend>Primary category</legend><p className={styles.hint}>Choose the one category that best represents your main service.</p>
        <div className={styles.categoryGrid}>{categories.map((category) => <label className={`${styles.choiceCard} ${values.primaryCategoryId === category.id ? styles.choiceCardSelected : ""}`} key={category.id}><input type="radio" name="primaryCategory" checked={values.primaryCategoryId === category.id} onChange={() => choosePrimary(category.id)} /><span><strong>{category.name}</strong><small>{category.description}</small></span></label>)}</div>
      </fieldset>

      {values.primaryCategoryId ? <fieldset className={styles.fieldset}><legend>Additional categories <span>({values.additionalCategoryIds.length}/2)</span></legend><p className={styles.hint}>Optional. Select up to two more categories if they are an important part of your work.</p>
        <div className={styles.compactGrid}>{categories.filter((category) => category.id !== values.primaryCategoryId).map((category) => <label className={styles.checkChoice} key={category.id}><input type="checkbox" checked={values.additionalCategoryIds.includes(category.id)} disabled={!values.additionalCategoryIds.includes(category.id) && values.additionalCategoryIds.length >= 2} onChange={() => toggleAdditional(category.id)} /><span>{category.name}</span></label>)}</div>
      </fieldset> : null}

      <fieldset className={styles.fieldset}><legend>Service tags <span>({values.serviceTagIds.length}/8)</span></legend><p className={styles.hint}>{values.primaryCategoryId ? "Select all that clearly describe your work, up to eight." : "Choose your primary category first to see its service tags."}</p>
        {availableTags.length ? <div className={styles.tagGrid}>{availableTags.map((tag) => <label className={`${styles.tagChoice} ${values.serviceTagIds.includes(tag.id) ? styles.tagChoiceSelected : ""}`} key={tag.id}><input type="checkbox" checked={values.serviceTagIds.includes(tag.id)} disabled={!values.serviceTagIds.includes(tag.id) && values.serviceTagIds.length >= 8} onChange={() => toggleTag(tag.id)} /><span>{tag.name}</span></label>)}</div> : null}
      </fieldset>

      <div className={styles.field}><div className={styles.labelRow}><label htmlFor="newService">Services you offer</label><span>{values.customServices.length}/15</span></div><p className={styles.hint}>Add your own customer-friendly service names, one at a time.</p>
        <div className={styles.addRow}><input id="newService" maxLength={80} value={newService} onChange={(event) => setNewService(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addService(); } }} placeholder="For example, Monthly social media support" /><button type="button" onClick={addService} disabled={!newService.trim() || values.customServices.length >= 15}>Add service</button></div>
        {values.customServices.length ? <ul className={styles.serviceList}>{values.customServices.map((service, index) => <li key={`${service}-${index}`}><span>{service}</span><button type="button" aria-label={`Remove ${service}`} onClick={() => update({ ...values, customServices: values.customServices.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button></li>)}</ul> : null}
      </div>

      <div className={styles.helpBox}><label className={styles.helpToggle}><input type="checkbox" checked={values.categoryHelpRequested} onChange={(event) => update({ ...values, categoryHelpRequested: event.target.checked, categoryHelpText: event.target.checked ? values.categoryHelpText : "" })} /><span><strong>I can’t find the right category</strong><small>Tell us what is missing. We’ll review it and either assign an existing category or use it to identify demand for a new one.</small></span></label>
        {values.categoryHelpRequested ? <div className={styles.field}><div className={styles.labelRow}><label htmlFor="categoryHelpText">Describe your service</label><span>{values.categoryHelpText.length}/1,000</span></div><textarea id="categoryHelpText" rows={5} maxLength={1000} value={values.categoryHelpText} onChange={(event) => update({ ...values, categoryHelpText: event.target.value })} /></div> : null}
      </div>
      <div className={styles.saveBar}><p aria-live="polite" className={hasError ? styles.error : ""}>{status}</p><button type="button" onClick={() => queueSave(latest.current)}>Save now</button></div>
    </form>
  </section>;
}
