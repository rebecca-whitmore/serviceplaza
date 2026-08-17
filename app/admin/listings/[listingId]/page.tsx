/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { setListingVisibility } from "../actions";
import styles from "./listing-detail.module.css";

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value)) : "Not recorded";
}
function text(value: string | null) { return value?.trim() || "Not provided"; }

export default async function AdminListingDetailPage({ params, searchParams }: { params: Promise<{ listingId: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { listingId } = await params; const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) notFound();
  const { supabase } = await requireAdmin();
  const { data: listing } = await supabase.from("listings").select("id, business_id, slug, publication_status, current_published_version_id, published_at").eq("id", listingId).maybeSingle();
  if (!listing?.current_published_version_id) notFound();
  const [{ data: version }, { data: business }, { data: categories }, { data: tags }, { data: services }, { data: image }, { data: history }, { data: updates }] = await Promise.all([
    supabase.from("listing_versions").select("*").eq("id", listing.current_published_version_id).maybeSingle(),
    supabase.from("businesses").select("contact_name, contact_email").eq("id", listing.business_id).maybeSingle(),
    supabase.from("listing_category_assignments").select("is_primary, categories(name)").eq("listing_version_id", listing.current_published_version_id),
    supabase.from("listing_service_tags").select("service_tags(name)").eq("listing_version_id", listing.current_published_version_id),
    supabase.from("listing_services").select("name, sort_order").eq("listing_version_id", listing.current_published_version_id).order("sort_order"),
    supabase.from("listing_images").select("published_storage_path, alt_text").eq("listing_version_id", listing.current_published_version_id).maybeSingle(),
    supabase.from("listing_management_events").select("id, action, reason, created_at").eq("listing_id", listingId).order("created_at", { ascending: false }),
    supabase.from("listing_versions").select("id, version_number, status, updated_at").eq("listing_id", listingId).in("status", ["draft", "pending", "changes_requested"]).order("version_number", { ascending: false }).limit(1),
  ]);
  if (!version) notFound();
  const publicImageUrl = image?.published_storage_path ? supabase.storage.from("listing-images-public").getPublicUrl(image.published_storage_path).data.publicUrl : null;
  const primaryCategory = categories?.find((item) => item.is_primary)?.categories?.name;
  const additionalCategories = categories?.filter((item) => !item.is_primary).map((item) => item.categories?.name).filter(Boolean) ?? [];
  const socialLinks = version.social_links && typeof version.social_links === "object" && !Array.isArray(version.social_links) ? Object.entries(version.social_links).filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1])) : [];
  const activeUpdate = updates?.[0];

  return <><Link className={styles.back} href="/admin/listings">← Back to listings</Link>
    <header className={styles.header}><div><p>Approved listing · Version {version.version_number}</p><h1>{version.business_name}</h1><span className={listing.publication_status === "published" ? styles.published : styles.hidden}>{listing.publication_status === "published" ? "Published" : "Hidden"}</span></div><div className={styles.owner}><strong>{business?.contact_name ?? "Owner not provided"}</strong><span>{business?.contact_email ?? "Email not provided"}</span><span>Published {formatDate(listing.published_at)}</span></div></header>
    {query.notice ? <p className={styles.success}>{query.notice === "hidden" ? "The listing is now hidden from the public directory." : "The listing has been restored to the public directory."}</p> : null}
    {query.error ? <p className={styles.error}>The listing visibility could not be changed. Please check the reason and try again.</p> : null}
    {activeUpdate ? <aside className={styles.update}><strong>Listing update in progress</strong><p>Version {activeUpdate.version_number} is {activeUpdate.status === "pending" ? "awaiting review" : activeUpdate.status === "draft" ? "being edited by the business owner" : "with the business owner for requested changes"}.</p>{activeUpdate.status === "pending" ? <Link href={`/admin/applications/${activeUpdate.id}`}>Open review</Link> : null}</aside> : null}
    <div className={styles.columns}><section className={styles.content}><section className={styles.card}><h2>Public presentation</h2>{publicImageUrl ? <img className={styles.image} src={publicImageUrl} alt={image?.alt_text ?? "Business listing image"}/> : <div className={styles.placeholder}>Standard placeholder image</div>}<h3>Short summary</h3><p>{text(version.short_summary)}</p><h3>Full description</h3><p className={styles.preline}>{text(version.full_description)}</p></section>
      <section className={styles.card}><h2>Categories and services</h2><dl><div><dt>Primary category</dt><dd>{primaryCategory ?? "Not assigned"}</dd></div><div><dt>Additional categories</dt><dd>{additionalCategories.length ? additionalCategories.join(", ") : "None"}</dd></div><div><dt>Service tags</dt><dd>{tags?.map((item) => item.service_tags?.name).filter(Boolean).join(", ") || "None"}</dd></div><div><dt>Services offered</dt><dd>{services?.map((item) => item.name).join(", ") || "None"}</dd></div></dl></section>
      <section className={styles.card}><h2>Contact and delivery</h2><dl><div><dt>Public contact</dt><dd>{text(version.public_contact_name)}</dd></div><div><dt>Email</dt><dd>{version.show_public_email ? text(version.public_email) : "Not displayed"}</dd></div><div><dt>Telephone</dt><dd>{version.show_public_phone ? text(version.public_phone) : "Not displayed"}</dd></div><div><dt>Website</dt><dd>{text(version.website_url)}</dd></div><div><dt>Social links</dt><dd>{socialLinks.length ? socialLinks.map(([name, url]) => `${name}: ${url}`).join(" · ") : "None"}</dd></div><div><dt>Works</dt><dd>{[version.offers_online && "Online", version.offers_in_person && "In person"].filter(Boolean).join(" and ") || "Not provided"}</dd></div><div><dt>Serves</dt><dd>{[version.serves_local && `Local (${[version.base_town_city, version.uk_region].filter(Boolean).join(", ")})`, version.serves_uk_wide && "UK-wide"].filter(Boolean).join(" and ") || "Not provided"}</dd></div></dl></section>
      {version.has_plaza_perk ? <section className={styles.card}><h2>Plaza Perk</h2><h3>{text(version.perk_title)}</h3><p className={styles.preline}>{text(version.perk_description)}</p><dl><div><dt>How to claim</dt><dd>{text(version.perk_redemption)}</dd></div><div><dt>Conditions</dt><dd>{text(version.perk_conditions)}</dd></div><div><dt>Expires</dt><dd>{version.perk_expires_on ? formatDate(version.perk_expires_on) : "No expiry date"}</dd></div></dl></section> : null}</section>
      <aside className={styles.sidebar}><section className={styles.card}><h2>Visibility controls</h2>{listing.publication_status === "published" ? <form action={setListingVisibility}><input type="hidden" name="listingId" value={listing.id}/><input type="hidden" name="makeVisible" value="false"/><label htmlFor="reason">Reason for hiding</label><textarea id="reason" name="reason" rows={4} maxLength={2000} required/><p>This takes effect immediately but does not delete the listing.</p><button className={styles.danger} type="submit">Hide listing</button></form> : <form action={setListingVisibility}><input type="hidden" name="listingId" value={listing.id}/><input type="hidden" name="makeVisible" value="true"/><label htmlFor="reason">Restoration note <span>(optional)</span></label><textarea id="reason" name="reason" rows={3} maxLength={2000}/><button type="submit">Restore listing</button></form>}</section>
      <section className={styles.card}><h2>Management history</h2>{history?.length ? <ol className={styles.history}>{history.map((event) => <li key={event.id}><strong>{event.action === "hidden" ? "Listing hidden" : "Listing restored"}</strong><span>{formatDate(event.created_at)}</span>{event.reason ? <p>{event.reason}</p> : null}</li>)}</ol> : <p>No visibility changes recorded.</p>}</section></aside></div>
  </>;
}
