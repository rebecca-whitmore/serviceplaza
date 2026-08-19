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

const plazaPerkPrompt = `Using everything I have already told you about my business and ideal customers in this conversation, help me create a suitable "Plaza Perk" for my Service Plaza listing.

A Plaza Perk is an exclusive benefit for people who discover my business through Service Plaza. It does not have to be a discount. It could be a free consultation or taster, a useful add-on or upgrade, a guide or resource, a small gift, priority booking, or another valuable benefit.

The Perk should:
- be genuinely useful and relevant to my ideal customers
- complement my usual services
- feel worthwhile without being difficult or unsustainable for my business to provide
- be clear, specific and easy to claim
- avoid exaggerated promises or misleading wording

First, ask me any essential questions you still need answered, including what I can sustainably offer and whether I want an expiry date or limits. Ask one question at a time and do not invent details.

Then suggest two varied Plaza Perk ideas and briefly explain why each could appeal to my customers. Help me choose and refine one. Once I am happy, provide final copy under these exact headings:

Perk title (maximum 160 characters)
What the Perk includes
How it can be claimed
Conditions (if needed)
Suggested expiry date (if appropriate)

Keep the final wording warm, clear and concise. Remind me to check that the offer, terms and availability are accurate and sustainable before publishing it.`;

function readDimensions(file: File): Promise<{ width: number; height: number; previewUrl: string }> {
  return new Promise((resolve, reject) => { const previewUrl = URL.createObjectURL(file); const image = new Image(); image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight, previewUrl }); image.onerror = () => { URL.revokeObjectURL(previewUrl); reject(new Error("Invalid image")); }; image.src = previewUrl; });
}

export function StandOutForm({ versionId, userId, initialValues, initialImage }: { versionId: string; userId: string; initialValues: Values; initialImage: InitialImage }) {
  const router = useRouter(); const [values, setValues] = useState(initialValues); const [image, setImage] = useState(initialImage);
  const [status, setStatus] = useState("Your progress is saved privately."); const [hasError, setHasError] = useState(false); const [uploading, setUploading] = useState(false); const [copyStatus, setCopyStatus] = useState("Copy prompt");
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

  async function copyPerkPrompt() {
    try { await navigator.clipboard.writeText(plazaPerkPrompt); setCopyStatus("Prompt copied"); window.setTimeout(() => setCopyStatus("Copy prompt"), 2500); }
    catch { setCopyStatus("Select and copy the prompt below"); }
  }

  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); if (!uploading) queueSave(latest.current, true); }}>
    <fieldset className={styles.fieldset}><legend>Logo or profile image <span>(optional)</span></legend><p className={styles.hint}>Use a square image. We recommend using a professional headshot or portrait if this is your personal brand. The minimum recommended size is 600 × 600 px; 1200 × 1200 px is preferred for the best quality. JPG, PNG and WebP files up to 5MB are accepted. Smaller images are not blocked, but they may appear less clear; other proportions may be cropped.</p><p className={styles.imageFallback}>If no image is available right now, we will use a placeholder image. You can update your listing at any time.</p>
      <div className={styles.imagePanel}>{image ? <div className={styles.imagePreview}><img src={image.previewUrl} alt={values.imageAltText || "Current business image preview"} /><div><strong>{image.filename}</strong><span>Private draft image</span></div></div> : <div className={styles.imageEmpty}><strong>No image added yet</strong><span>Your image remains private while your application is a draft.</span></div>}
        <div className={styles.imageActions}><label className={styles.uploadButton}>{uploading ? "Working…" : image ? "Replace image" : "Choose image"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { void uploadImage(event.target.files?.[0]); event.target.value = ""; }} /></label>{image ? <button className={styles.removeImageButton} type="button" disabled={uploading} onClick={() => void removeImage()}>Remove image</button> : null}</div>
      </div>
      {image ? <div className={styles.field}><div className={styles.labelRow}><label htmlFor="imageAltText">Image description <span className={styles.optional}>(optional)</span></label><span>{values.imageAltText.length}/300</span></div><p className={styles.hint}>Briefly describe the image for visitors using screen readers. A business logo can simply be described as, for example, “Acme Studio logo”.</p><input id="imageAltText" maxLength={300} value={values.imageAltText} onChange={(event) => update({ imageAltText: event.target.value })} /></div> : null}
    </fieldset>

    <div className={styles.formDivider} />
    <fieldset className={styles.fieldset}><legend>Plaza Perk <span>(optional but recommended)</span></legend><aside className={styles.perkIntro}><strong>Give visitors an extra reason to choose you</strong><p>Your Plaza Perk is a special benefit offered to Service Plaza visitors. It does not have to be a discount; it could be a useful extra that adds value.</p><details className={styles.perkIdeas}><summary><strong>Toggle for ideas</strong></summary><div><p>For example:</p><ul><li>A percentage or fixed-price discount</li><li>A free consultation, taster session or trial</li><li>A complimentary add-on or upgrade</li><li>A free guide, resource or small gift</li><li>Priority booking or another exclusive benefit</li></ul><p>Choose something relevant to your customers and sustainable for your business. Include any code, expiry date or terms they need to claim it.</p><details className={styles.perkAiPrompt}><summary><strong>If you used AI for your business descriptions, open a follow-on prompt.</strong></summary><div className={styles.aiHelperContent}><p>Continue in the same AI conversation so it can use the business context you already provided.</p><p className={styles.aiCaution}>Always check that the suggested benefit, wording, availability and conditions are accurate and sustainable before publishing it.</p><button type="button" onClick={() => void copyPerkPrompt()}>{copyStatus}</button><pre tabIndex={0}>{plazaPerkPrompt}</pre></div></details></div></details></aside>
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
