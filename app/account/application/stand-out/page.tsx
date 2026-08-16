import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StandOutForm } from "./stand-out-form";
import styles from "../application.module.css";

export default async function StandOutPage() {
  const supabase = await createClient(); const { data: auth, error } = await supabase.auth.getClaims();
  if (error || !auth?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", auth.claims.sub).maybeSingle();
  if (!business) redirect("/account");
  const { data: listing } = await supabase.from("listings").select("id").eq("business_id", business.id).maybeSingle();
  if (!listing) redirect("/account");
  const { data: draft } = await supabase.from("listing_versions").select("id, has_plaza_perk, perk_title, perk_description, perk_redemption, perk_conditions, perk_expires_on").eq("listing_id", listing.id).eq("status", "draft").maybeSingle();
  if (!draft) redirect("/account");
  const { data: image } = await supabase.from("listing_images").select("private_storage_path, original_filename, display_publicly, alt_text").eq("listing_version_id", draft.id).maybeSingle();
  const { data: signed } = image ? await supabase.storage.from("listing-images-private").createSignedUrl(image.private_storage_path, 3600) : { data: null };

  return <><header className={styles.header}><div><h1>Make your listing stand out</h1></div></header>
    <p className={styles.intro}>Add a recognisable image and, if you wish, a special Plaza Perk for Service Plaza visitors.</p>
    <StandOutForm versionId={draft.id} userId={auth.claims.sub} initialImage={image && signed?.signedUrl ? { path: image.private_storage_path, filename: image.original_filename, previewUrl: signed.signedUrl, displayPublicly: image.display_publicly, altText: image.alt_text ?? "" } : null} initialValues={{ displayImagePublicly: image?.display_publicly ?? false, imageAltText: image?.alt_text ?? "", hasPlazaPerk: draft.has_plaza_perk, perkTitle: draft.perk_title ?? "", perkDescription: draft.perk_description ?? "", perkRedemption: draft.perk_redemption ?? "", perkConditions: draft.perk_conditions ?? "", perkExpiresOn: draft.perk_expires_on ?? "" }} />
  </>;
}
