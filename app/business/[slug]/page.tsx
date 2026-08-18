/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./listing.module.css";

type NamedItem = { name: string; slug?: string };
function namedItems(value: unknown): NamedItem[] { return Array.isArray(value) ? value.filter((item): item is NamedItem => Boolean(item) && typeof item === "object" && typeof (item as NamedItem).name === "string") : []; }
function namedItem(value: unknown): NamedItem | null { return value && typeof value === "object" && typeof (value as NamedItem).name === "string" ? value as NamedItem : null; }
function socialEntries(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string" && /^https?:\/\//.test(entry[1])) : []; }
function label(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

async function getListing(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_published_listing_details", { target_slug: slug }).maybeSingle();
  return { supabase, listing: data };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const { supabase, listing } = await getListing(slug);
  if (!listing) return { title: "Business not found | Service Plaza" };
  const image = listing.published_image_path ? supabase.storage.from("listing-images-public").getPublicUrl(listing.published_image_path).data.publicUrl : undefined;
  return { title: `${listing.business_name} | Service Plaza`, description: listing.short_summary ?? undefined, alternates: { canonical: `/business/${listing.slug}` }, openGraph: { title: listing.business_name ?? "Service Plaza business", description: listing.short_summary ?? undefined, type: "website", images: image ? [image] : undefined } };
}

export default async function PublicListingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ website?: string }> }) {
  const { slug } = await params; const query = await searchParams;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  const { supabase, listing } = await getListing(slug); if (!listing?.version_id || !listing.slug) notFound();
  const { data: taxonomyRows } = await supabase.rpc("get_public_listing_taxonomy", { target_version_id: listing.version_id });
  const taxonomy = taxonomyRows?.[0]; const primaryCategory = namedItem(taxonomy?.primary_category);
  const additionalCategories = namedItems(taxonomy?.additional_categories); const serviceTags = namedItems(taxonomy?.service_tags); const services = namedItems(taxonomy?.services);
  const socials = socialEntries(listing.social_links);
  const imageUrl = listing.published_image_path ? supabase.storage.from("listing-images-public").getPublicUrl(listing.published_image_path).data.publicUrl : null;
  const workModes = [listing.offers_online && "Online", listing.offers_in_person && "In person"].filter(Boolean);
  const serviceAreas = [listing.serves_local && "Serves locally", listing.serves_uk_wide && "Serves UK-wide"].filter(Boolean);
  const location = [listing.base_town_city, listing.uk_region].filter(Boolean).join(", ");

  return <div className={styles.page}><header className={styles.siteHeader}><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><nav aria-label="Public navigation"><Link href="/">Home</Link></nav></header>
    <main><div className={styles.breadcrumb}><Link href="/">Service Plaza</Link><span aria-hidden="true">/</span><span>{primaryCategory?.name ?? "UK businesses"}</span></div>
      {query.website === "unavailable" ? <p className={styles.linkError}>This business’s website is not available right now. Please try another contact option.</p> : null}
      <section className={styles.hero}><div className={styles.visual}>{imageUrl ? <img src={imageUrl} alt={`${listing.business_name} business image`}/> : <div className={styles.placeholder}><span>SP</span><small>Service Plaza</small></div>}{listing.has_plaza_perk ? <span className={styles.perkBadge}>Plaza Perk</span> : null}</div><div className={styles.heroCopy}><div className={styles.eyebrows}>{primaryCategory ? <span>{primaryCategory.name}</span> : null}</div><h1>{listing.business_name}</h1><p className={styles.summary}>{listing.short_summary}</p><div className={styles.facts}>{workModes.map((item) => <span key={String(item)}>{item}</span>)}{serviceAreas.map((item) => <span key={String(item)}>{item}</span>)}{location ? <span>Based in {location}</span> : null}</div>{listing.website_url ? <a className={styles.primaryAction} href={`/go/${listing.slug}/website`} target="_blank" rel="noopener noreferrer">Visit website <span aria-hidden="true">↗</span></a> : null}{listing.has_plaza_perk ? <a className={styles.perkJump} href="#plaza-perk">View their Plaza Perk</a> : null}</div></section>

      <div className={styles.layout}><div className={styles.mainColumn}><section className={styles.section}><p className={styles.kicker}>Meet the business</p><h2>About {listing.business_name}</h2><div className={styles.longCopy}>{listing.full_description?.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></section>
        {(services.length || serviceTags.length) ? <section className={styles.section}><p className={styles.kicker}>What they offer</p><h2>Services and specialisms</h2>{services.length ? <ul className={styles.services}>{services.map((service) => <li key={service.name}>{service.name}</li>)}</ul> : null}{serviceTags.length ? <div className={styles.tags}>{serviceTags.map((tag) => <span key={tag.name}>{tag.name}</span>)}</div> : null}</section> : null}
        <section className={styles.section}><p className={styles.kicker}>Working together</p><h2>How and where they work</h2><div className={styles.detailGrid}><div><strong>Appointments and delivery</strong><p>{workModes.join(" and ") || "Contact the business for details."}</p></div><div><strong>Area served</strong><p>{serviceAreas.join(" and ") || "Contact the business for details."}</p></div>{location ? <div><strong>Business base</strong><p>{location}</p></div> : <div><strong>Business base</strong><p>UK-based; precise location kept private.</p></div>}</div></section>
        {listing.has_plaza_perk ? <section className={styles.perkPanel} id="plaza-perk"><p className={styles.kicker}>Exclusive extra</p><h2>{listing.perk_title}</h2><p>{listing.perk_description}</p><div><strong>How to claim</strong><p>{listing.perk_redemption}</p></div>{listing.perk_conditions ? <div><strong>Conditions</strong><p>{listing.perk_conditions}</p></div> : null}{listing.perk_expires_on ? <small>Available until {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(listing.perk_expires_on))}</small> : null}</section> : null}
        {additionalCategories.length ? <section className={styles.related}><strong>Also listed under</strong><p>{additionalCategories.map((category) => category.name).join(" · ")}</p></section> : null}
      </div><aside className={styles.sidebar}><section className={styles.contactCard}><p className={styles.kicker}>Get in touch</p><h2>Contact {listing.business_name}</h2>{listing.public_contact_name ? <p>Contact <strong>{listing.public_contact_name}</strong></p> : null}{listing.website_url ? <a className={styles.primaryAction} href={`/go/${listing.slug}/website`} target="_blank" rel="noopener noreferrer">Visit website <span aria-hidden="true">↗</span></a> : null}{listing.public_email ? <a href={`mailto:${listing.public_email}`}>Email {listing.public_contact_name ?? "the business"}</a> : null}{listing.public_phone ? <a href={`tel:${listing.public_phone.replace(/[^+\d]/g, "")}`}>{listing.public_phone}</a> : null}{socials.length ? <div className={styles.socials}>{socials.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noopener noreferrer">{label(name)} <span aria-hidden="true">↗</span></a>)}</div> : null}</section>
        <section className={styles.ukCard}><strong>UK-based specialist</strong><p>Service Plaza exclusively features businesses based in the United Kingdom.</p></section></aside></div>
      <section className={styles.explore}><p className={styles.kicker}>Keep exploring</p><h2>Find the right UK specialist for you</h2><p>Explore more independent service businesses as the Service Plaza directory grows.</p><Link href="/">Return to Service Plaza</Link></section>
      <aside className={styles.disclaimer}><strong>A note from Service Plaza</strong><p>Service Plaza provides directory information to help visitors discover independent businesses. Inclusion does not represent an endorsement, guarantee or recommendation of a business or its services. Please make your own checks before purchasing or engaging a provider.</p></aside>
    </main><footer><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><p>Independent UK-based service businesses, brought together.</p><Link href="/login">List or manage a business</Link></footer></div>;
}
