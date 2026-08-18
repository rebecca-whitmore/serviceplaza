/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitPanel } from "./submit-panel";
import styles from "../application.module.css";

function ReviewSection({ title, href, complete, children }: { title: string; href: string; complete: boolean; children: React.ReactNode }) {
  return <section className={styles.reviewCard}><header><div><span className={complete ? styles.completeBadge : styles.incompleteBadge}>{complete ? "Complete" : "Needs attention"}</span><h2>{title}</h2></div><Link href={href}>Edit</Link></header><div className={styles.reviewContent}>{children}</div></section>;
}
function Items({ items }: { items: Array<[string, React.ReactNode]> }) { return <dl className={styles.reviewList}>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || <span className={styles.notProvided}>Not provided</span>}</dd></div>)}</dl>; }

export default async function ReviewPage() {
  const supabase = await createClient(); const { data: auth, error } = await supabase.auth.getClaims();
  if (error || !auth?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id, contact_name").eq("owner_user_id", auth.claims.sub).maybeSingle(); if (!business) redirect("/account");
  const { data: listing } = await supabase.from("listings").select("id").eq("business_id", business.id).maybeSingle(); if (!listing) redirect("/account");
  const { data: draft } = await supabase.from("listing_versions").select("*").eq("listing_id", listing.id).eq("status", "draft").maybeSingle(); if (!draft) redirect("/account");
  const [{ data: assignments }, { data: categories }, { data: selectedTags }, { data: tags }, { data: services }, { data: image }] = await Promise.all([
    supabase.from("listing_category_assignments").select("category_id, is_primary").eq("listing_version_id", draft.id),
    supabase.from("categories").select("id, name"),
    supabase.from("listing_service_tags").select("service_tag_id").eq("listing_version_id", draft.id),
    supabase.from("service_tags").select("id, name"),
    supabase.from("listing_services").select("name").eq("listing_version_id", draft.id).order("sort_order"),
    supabase.from("listing_images").select("private_storage_path, original_filename, display_publicly, alt_text").eq("listing_version_id", draft.id).maybeSingle(),
  ]);
  const categoryName = (id?: string) => categories?.find((category) => category.id === id)?.name;
  const primary = assignments?.find((item) => item.is_primary); const additional = assignments?.filter((item) => !item.is_primary).map((item) => categoryName(item.category_id)).filter(Boolean).join(", ");
  const tagNames = selectedTags?.map((selected) => tags?.find((tag) => tag.id === selected.service_tag_id)?.name).filter(Boolean).join(", ");
  const socialLinks = draft.social_links && typeof draft.social_links === "object" && !Array.isArray(draft.social_links) ? Object.entries(draft.social_links).filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1])) : [];
  const basicComplete = Boolean(business.contact_name.trim() && draft.business_name.trim() && (primary || (draft.category_help_requested && draft.category_help_text?.trim())));
  const contactComplete = Boolean(draft.public_contact_name?.trim()); const aboutComplete = Boolean(draft.short_summary.trim() && draft.full_description.trim().length >= 100);
  const workComplete = Boolean(draft.is_uk_based && draft.uk_region?.trim() && (draft.offers_online || draft.offers_in_person) && (draft.serves_local || draft.serves_uk_wide));
  const perkComplete = !draft.has_plaza_perk || Boolean(draft.perk_title?.trim() && draft.perk_description?.trim() && draft.perk_redemption?.trim()); const standOutComplete = perkComplete;
  const ready = basicComplete && contactComplete && aboutComplete && workComplete && standOutComplete;
  const { data: signed } = image ? await supabase.storage.from("listing-images-private").createSignedUrl(image.private_storage_path, 3600) : { data: null };

  return <><header className={styles.header}><div><h1>Review &amp; submit</h1></div></header><p className={styles.intro}>Check how your application comes together. Use any Edit link to make changes before sending it to Service Plaza for review.</p>
    <div className={styles.reviewGrid}>
      <ReviewSection title="Basic information & services" href="/account/application/basic-information" complete={basicComplete}><Items items={[["Your name", business.contact_name], ["Business name", draft.business_name], ["Primary category", draft.category_help_requested ? `Category help requested: ${draft.category_help_text}` : categoryName(primary?.category_id)], ["Additional categories", additional], ["Service tags", tagNames], ["Services offered", services?.map((service) => service.name).join(", ")]]} /></ReviewSection>
      <ReviewSection title="Contact details" href="/account/application/contact-details" complete={contactComplete}><Items items={[["Listing contact", draft.public_contact_name], ["Email", draft.public_email], ["Telephone", draft.public_phone], ["Website", draft.website_url], ["Social links", socialLinks.length ? socialLinks.map(([name]) => name[0].toUpperCase() + name.slice(1)).join(", ") : null]]} /></ReviewSection>
      <ReviewSection title="About your business" href="/account/application/about-business" complete={aboutComplete}><Items items={[["Short summary", draft.short_summary], ["Full description", draft.full_description]]} /></ReviewSection>
      <ReviewSection title="How & where you work" href="/account/application/how-you-work" complete={workComplete}><Items items={[["UK-based business", draft.is_uk_based ? "Confirmed" : null], ["Business base", [draft.base_town_city, draft.uk_region].filter(Boolean).join(", ")], ["Public location", draft.show_base_location ? `${draft.uk_region} shown on public listing` : "Not shown"], ["How you work", [draft.offers_online && "Online", draft.offers_in_person && "In person"].filter(Boolean).join(", ")], ["Area served", [draft.serves_local && "Local area", draft.serves_uk_wide && "Across the UK"].filter(Boolean).join(", ")]]} /></ReviewSection>
      <ReviewSection title="Make your listing stand out" href="/account/application/stand-out" complete={standOutComplete}><div className={styles.reviewImage}>{signed?.signedUrl ? <img src={signed.signedUrl} alt={image?.alt_text || "Business image preview"} /> : null}<Items items={[["Image", image?.original_filename ?? "Placeholder image will be used"], ["Plaza Perk", draft.has_plaza_perk ? draft.perk_title : "Not added"], ["Perk details", draft.has_plaza_perk ? draft.perk_description : null], ["How to claim", draft.has_plaza_perk ? draft.perk_redemption : null], ["Conditions", draft.perk_conditions], ["Expiry", draft.perk_expires_on]]} /></div></ReviewSection>
    </div>
    <SubmitPanel versionId={draft.id} ready={ready} />
  </>;
}
