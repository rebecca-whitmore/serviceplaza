/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { DecisionPanel } from "./decision-panel";
import styles from "./detail.module.css";

function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value)) : "Not recorded"; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className={styles.card}><header><h2>{title}</h2></header><div className={styles.body}>{children}</div></section>; }
function List({ items }: { items: Array<[string, React.ReactNode]> }) { return <dl className={styles.list}>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || <span className={styles.empty}>Not provided</span>}</dd></div>)}</dl>; }

export default async function ApplicationDetailPage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params; const { supabase } = await requireAdmin();
  const { data: version } = await supabase.from("listing_versions").select("*").eq("id", versionId).maybeSingle(); if (!version) notFound();
  const { data: listing } = await supabase.from("listings").select("id, business_id, publication_status").eq("id", version.listing_id).maybeSingle(); if (!listing) notFound();
  const [{ data: business }, { data: assignments }, { data: categories }, { data: selectedTags }, { data: tags }, { data: services }, { data: image }, { data: events }] = await Promise.all([
    supabase.from("businesses").select("contact_name, contact_email, contact_phone").eq("id", listing.business_id).maybeSingle(),
    supabase.from("listing_category_assignments").select("category_id, is_primary").eq("listing_version_id", version.id),
    supabase.from("categories").select("id, name"),
    supabase.from("listing_service_tags").select("service_tag_id").eq("listing_version_id", version.id),
    supabase.from("service_tags").select("id, name"),
    supabase.from("listing_services").select("name").eq("listing_version_id", version.id).order("sort_order"),
    supabase.from("listing_images").select("private_storage_path, original_filename, display_publicly, alt_text, width, height, byte_size").eq("listing_version_id", version.id).maybeSingle(),
    supabase.from("review_events").select("event_type, applicant_message, private_admin_note, created_at").eq("listing_version_id", version.id).order("created_at", { ascending: false }),
  ]);
  const categoryName = (id?: string) => categories?.find((category) => category.id === id)?.name;
  const primary = assignments?.find((item) => item.is_primary); const additional = assignments?.filter((item) => !item.is_primary).map((item) => categoryName(item.category_id)).filter(Boolean).join(", ");
  const tagNames = selectedTags?.map((selected) => tags?.find((tag) => tag.id === selected.service_tag_id)?.name).filter(Boolean).join(", ");
  const socialLinks = version.social_links && typeof version.social_links === "object" && !Array.isArray(version.social_links) ? Object.entries(version.social_links).filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1])).map(([name, url]) => `${name}: ${url}`).join("\n") : null;
  const { data: signed } = image ? await supabase.storage.from("listing-images-private").createSignedUrl(image.private_storage_path, 3600) : { data: null };

  return <><Link className={styles.back} href="/admin">← Review queue</Link><header className={styles.header}><div><h1>{version.business_name || "Unnamed business"}</h1></div><div className={styles.meta}><strong>{version.status.replaceAll("_", " ")}</strong><span>Submitted {formatDate(version.submitted_at)}</span><span>Version {version.version_number}</span></div></header>
    <div className={styles.grid}><div className={styles.sections}>
      <Section title="Basic information & services"><List items={[["Business name", version.business_name], ["Primary category", version.category_help_requested ? `Help requested: ${version.category_help_text}` : categoryName(primary?.category_id)], ["Additional categories", additional], ["Service tags", tagNames], ["Services offered", services?.map((service) => service.name).join(", ")]]} /></Section>
      <Section title="Public contact details"><List items={[["Contact name", version.public_contact_name], ["Email", version.public_email], ["Telephone", version.public_phone], ["Website", version.website_url], ["Social links", socialLinks]]} /></Section>
      <Section title="About the business"><List items={[["Short summary", version.short_summary], ["Full description", version.full_description]]} /></Section>
      <Section title="How & where they work"><List items={[["Delivery", [version.offers_online && "Online", version.offers_in_person && "In person"].filter(Boolean).join(", ")], ["Area served", [version.serves_local && "Local area", version.serves_uk_wide && "Across the UK"].filter(Boolean).join(", ")], ["Local base", version.serves_local ? [version.base_town_city, version.uk_region].filter(Boolean).join(", ") : null]]} /></Section>
      <Section title="Image & Plaza Perk">{signed?.signedUrl ? <img className={styles.image} src={signed.signedUrl} alt={image?.alt_text || "Submitted business image"} /> : null}<List items={[["Image", image ? `${image.original_filename} · ${image.width ?? "?"} × ${image.height ?? "?"} px` : "Placeholder image required"], ["Image description", image?.alt_text], ["Plaza Perk", version.has_plaza_perk ? version.perk_title : "Not added"], ["Perk details", version.has_plaza_perk ? version.perk_description : null], ["How to claim", version.has_plaza_perk ? version.perk_redemption : null], ["Conditions", version.perk_conditions], ["Expiry", version.perk_expires_on]]} /></Section>
      <Section title="Review history">{events?.length ? <ul className={styles.history}>{events.map((event, index) => <li key={`${event.created_at}-${index}`}><strong>{event.event_type.replaceAll("_", " ")}</strong><span>{formatDate(event.created_at)}</span>{event.applicant_message ? <p>Applicant message: {event.applicant_message}</p> : null}{event.private_admin_note ? <p>Private note: {event.private_admin_note}</p> : null}</li>)}</ul> : <span className={styles.empty}>No review events recorded.</span>}</Section>
    </div><aside className={styles.private}><h2>Private applicant details</h2><div><span className={styles.label}>Name</span><p>{business?.contact_name ?? "Not provided"}</p></div><div><span className={styles.label}>Sign-in email</span><p>{business?.contact_email ?? "Not provided"}</p></div><div><span className={styles.label}>Telephone</span><p>{business?.contact_phone ?? "Not provided"}</p></div><div><span className={styles.label}>Application ID</span><p>{version.id}</p></div><div><span className={styles.label}>Listing status</span><p>{listing.publication_status}</p></div></aside></div>
    {version.status === "pending" ? <DecisionPanel versionId={version.id} /> : null}
  </>;
}
