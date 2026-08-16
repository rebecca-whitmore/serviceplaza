/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerListingImage, removeListingImage, saveStandOutDetails, type StandOutDetails } from "../actions";
import styles from "../application.module.css";

type Values = Omit<StandOutDetails, "versionId">;
type InitialImage = { path: string; filename: string; previewUrl: string; displayPublicly: boolean; altText: string } | null;

function readDimensions(file: File): Promise<{ width: number; height: number; previewUrl: string }> {
  return new Promise((resolve, reject) => { const previewUrl = URL.createObjectURL(file); const image = new Image(); image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight, previewUrl }); image.onerror = () => { URL.revokeObjectURL(previewUrl); reject(new Error("Invalid image")); }; image.src = previewUrl; });
}

export function StandOutForm({ versionId, userId, initialValues, initialImage }: { versionId: string; userId: string; initialValues: Values; initialImage: InitialImage }) {
  const router = useRouter(); const [values, setValues] = useState(initialValues); const [image, setImage] = useState(initialImage);
  const [status, setStatus] = useState("Your progress is saved privately."); const [hasError, setHasError] = useState(false); const [uploading, setUploading] = useState(false);
  const changed = useRef(false); const latest = useRef(values); const chain = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => { latest.current = values; }, [values]);
  const queueSave = useCallback((snapshot: Values, continueAfter = false) => {
    setStatus("Saving…"); setHasError(false);
    chain.current = chain.current.then(async () => {
      const result = await saveStandOutDetails({ versionId, ...snapshot }, continueAfter).catch(() => ({ ok: false as const, message: "We couldn’t save your changes. Please try again." }));
      if (!continueAfter && JSON.stringify(snapshot) !== JSON.stringify(latest.current)) return;
      setHasError(!result.ok); setStatus(result.ok ? "All changes saved." : result.message);
      if (result.ok && continueAfter) router.push("/account/application/review");
    });
  }, [router, versionId]);
  useEffect(() => { if (!changed.current) return; const timer = window.setTimeout(() => queueSave(values), 900); return () => window.clearTimeout(timer); }, [queueSave, values]);
  function update(patch: Partial<Values>) { changed.current = true; setStatus("Unsaved changes"); setHasError(false); setValues((current) => ({ ...current, ...patch })); }

  async function uploadImage(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5_242_880) { setHasError(true); setStatus("Choose a JPG, PNG or WebP image no larger than 5MB."); return; }
    setUploading(true); setHasError(false); setStatus("Uploading image…");
    let previewUrl = "";
    try {
      const dimensions = await readDimensions(file); previewUrl = dimensions.previewUrl;
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const storagePath = `${userId}/${versionId}/${crypto.randomUUID()}.${extension}`;
      const supabase = createClient(); const { error: uploadError } = await supabase.storage.from("listing-images-private").upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const result = await registerListingImage({ versionId, storagePath, filename: file.name, mimeType: file.type, byteSize: file.size, width: dimensions.width, height: dimensions.height, displayPublicly: true, altText: values.imageAltText });
      if (!result.ok) { await supabase.storage.from("listing-images-private").remove([storagePath]); throw new Error(result.message); }
      if (result.oldPath && result.oldPath !== storagePath) await supabase.storage.from("listing-images-private").remove([result.oldPath]);
      if (image?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(image.previewUrl);
      setImage({ path: storagePath, filename: file.name, previewUrl, displayPublicly: true, altText: values.imageAltText });
      setStatus("Image uploaded and saved.");
    } catch (error) { if (previewUrl) URL.revokeObjectURL(previewUrl); setHasError(true); setStatus(error instanceof Error && error.message ? error.message : "We couldn’t upload your image. Please try again."); }
    finally { setUploading(false); }
  }

  async function removeImage() {
    setUploading(true); setHasError(false); setStatus("Removing image…");
    const result = await removeListingImage(versionId).catch(() => ({ ok: false as const, message: "We couldn’t remove your image. Please try again." }));
    if (!result.ok) { setHasError(true); setStatus(result.message); setUploading(false); return; }
    if (image?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(image.previewUrl);
    setImage(null); update({ displayImagePublicly: true, imageAltText: "" }); setStatus("Image removed. A placeholder will be used."); setUploading(false);
  }

  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); if (!uploading) queueSave(latest.current, true); }}>
    <fieldset className={styles.fieldset}><legend>Logo or profile image <span>(optional)</span></legend><p className={styles.hint}>For best results, use a square image—ideally 1200 × 1200 px and at least 600 × 600 px. JPG, PNG and WebP files up to 5MB are accepted; other proportions may be cropped.</p><p className={styles.imageFallback}>If no image is available right now, we will use a placeholder image. You can update your listing at any time.</p>
      <div className={styles.imagePanel}>{image ? <div className={styles.imagePreview}><img src={image.previewUrl} alt={values.imageAltText || "Current business image preview"} /><div><strong>{image.filename}</strong><span>Private draft image</span></div></div> : <div className={styles.imageEmpty}><strong>No image added yet</strong><span>Your image remains private while your application is a draft.</span></div>}
        <div className={styles.imageActions}><label className={styles.uploadButton}>{uploading ? "Working…" : image ? "Replace image" : "Choose image"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { void uploadImage(event.target.files?.[0]); event.target.value = ""; }} /></label>{image ? <button className={styles.removeImageButton} type="button" disabled={uploading} onClick={() => void removeImage()}>Remove image</button> : null}</div>
      </div>
      {image ? <div className={styles.field}><div className={styles.labelRow}><label htmlFor="imageAltText">Image description <span className={styles.optional}>(optional)</span></label><span>{values.imageAltText.length}/300</span></div><p className={styles.hint}>Briefly describe the image for visitors using screen readers. A business logo can simply be described as, for example, “Acme Studio logo”.</p><input id="imageAltText" maxLength={300} value={values.imageAltText} onChange={(event) => update({ imageAltText: event.target.value })} /></div> : null}
    </fieldset>

    <div className={styles.formDivider} />
    <fieldset className={styles.fieldset}><legend>Plaza Perk <span>(optional but recommended)</span></legend><aside className={styles.perkIntro}><strong>Give visitors an extra reason to choose you</strong><p>A Plaza Perk is a special offer or added benefit available through your Service Plaza listing. It can help your business stand out, but it is entirely optional.</p></aside>
      <label className={styles.perkToggle}><input type="checkbox" checked={values.hasPlazaPerk} onChange={(event) => update({ hasPlazaPerk: event.target.checked, ...(!event.target.checked ? { perkTitle: "", perkDescription: "", perkRedemption: "", perkConditions: "", perkExpiresOn: "" } : {}) })} /><span><strong>I’d like to add a Plaza Perk</strong><small>You can change or remove it later by submitting an update.</small></span></label>
    </fieldset>
    {values.hasPlazaPerk ? <div className={styles.perkFields}>
      <div className={styles.field}><div className={styles.labelRow}><label htmlFor="perkTitle">Perk title</label><span>{values.perkTitle.length}/160</span></div><p className={styles.hint}>A short headline, such as “Free 20-minute discovery call”.</p><input id="perkTitle" maxLength={160} value={values.perkTitle} onChange={(event) => update({ perkTitle: event.target.value })} /></div>
      <div className={styles.field}><div className={styles.labelRow}><label htmlFor="perkDescription">What does the Perk include?</label><span>{values.perkDescription.length}/1,000</span></div><textarea id="perkDescription" rows={5} maxLength={1000} value={values.perkDescription} onChange={(event) => update({ perkDescription: event.target.value })} /></div>
      <div className={styles.field}><div className={styles.labelRow}><label htmlFor="perkRedemption">How can it be claimed?</label><span>{values.perkRedemption.length}/1,000</span></div><p className={styles.hint}>Explain what the customer should do or mention when contacting you.</p><textarea id="perkRedemption" rows={4} maxLength={1000} value={values.perkRedemption} onChange={(event) => update({ perkRedemption: event.target.value })} /></div>
      <div className={styles.field}><div className={styles.labelRow}><label htmlFor="perkConditions">Conditions <span className={styles.optional}>(optional)</span></label><span>{values.perkConditions.length}/1,000</span></div><textarea id="perkConditions" rows={3} maxLength={1000} value={values.perkConditions} onChange={(event) => update({ perkConditions: event.target.value })} /></div>
      <div className={styles.field}><label htmlFor="perkExpiresOn">Expiry date <span className={styles.optional}>(optional)</span></label><input id="perkExpiresOn" type="date" value={values.perkExpiresOn} onChange={(event) => update({ perkExpiresOn: event.target.value })} /></div>
    </div> : null}
    <div className={styles.saveBar}><p aria-live="polite" className={hasError ? styles.error : ""}>{status}</p><div className={styles.saveActions}><Link className={styles.secondaryLink} href="/account/application/how-you-work">Back</Link><button className={styles.saveOnly} type="button" onClick={() => queueSave(latest.current)}>Save draft</button><button type="submit" disabled={uploading}>Save and continue</button></div></div>
  </form>;
}
