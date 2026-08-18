/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicDirectory, type DirectoryListing } from "@/lib/public-directory";
import styles from "./directory.module.css";

type Query = { q?: string; category?: string; online?: string; inPerson?: string; perk?: string; location?: string; sort?: string };
const clean = (value?: string) => value?.trim() ?? "";
const includes = (source: string | null | undefined, search: string) => source?.toLocaleLowerCase("en-GB").includes(search) ?? false;

function BusinessCard({ listing }: { listing: DirectoryListing }) {
  const location = [listing.base_town_city, listing.uk_region].filter(Boolean).join(", ");
  return <article className={styles.card}><Link className={styles.cardImage} href={`/business/${listing.slug}`}>{listing.imageUrl ? <img src={listing.imageUrl} alt={`${listing.business_name} business image`}/> : <span className={styles.placeholder}><strong>SP</strong><small>Service Plaza</small></span>}{listing.has_plaza_perk ? <span className={styles.perkBadge}>Plaza Perk</span> : null}</Link><div className={styles.cardBody}>{listing.primaryCategory ? <Link className={styles.category} href={`/businesses/${listing.primaryCategory.slug}`}>{listing.primaryCategory.name}</Link> : null}<h2><Link href={`/business/${listing.slug}`}>{listing.business_name}</Link></h2><p>{listing.short_summary}</p><div className={styles.facts}>{listing.offers_online ? <span>Online</span> : null}{listing.offers_in_person ? <span>In person</span> : null}{location ? <span>{location}</span> : null}</div><Link className={styles.viewLink} href={`/business/${listing.slug}`}>View listing <span aria-hidden="true">→</span></Link></div></article>;
}

export async function DirectoryView({ query, categorySlug }: { query: Query; categorySlug?: string }) {
  const { listings, categories } = await loadPublicDirectory();
  const fixedCategory = categorySlug ? categories.find((category) => category.slug === categorySlug) : undefined;
  if (categorySlug && !fixedCategory) notFound();
  const keyword = clean(query.q).toLocaleLowerCase("en-GB"); const location = clean(query.location).toLocaleLowerCase("en-GB");
  const selectedCategory = fixedCategory?.slug ?? clean(query.category); const sort = query.sort === "recent" ? "recent" : "az";
  const filtered = listings.filter((listing) => {
    const categorySlugs = [listing.primaryCategory?.slug, ...listing.additionalCategories.map((category) => category.slug)];
    const searchable = [listing.business_name, listing.short_summary, listing.full_description, listing.primaryCategory?.name, ...listing.additionalCategories.map((category) => category.name), ...listing.serviceTags, ...listing.services];
    return (!selectedCategory || categorySlugs.includes(selectedCategory))
      && (!query.online || listing.offers_online) && (!query.inPerson || listing.offers_in_person) && (!query.perk || listing.has_plaza_perk)
      && (!location || includes(listing.base_town_city, location) || includes(listing.uk_region, location))
      && (!keyword || searchable.some((value) => includes(value, keyword)));
  }).sort((a, b) => sort === "recent"
    ? new Date(b.first_published_at ?? b.published_at ?? 0).getTime() - new Date(a.first_published_at ?? a.published_at ?? 0).getTime()
    : (a.business_name ?? "").localeCompare(b.business_name ?? "", "en-GB", { sensitivity: "base" }));
  const action = fixedCategory ? `/businesses/${fixedCategory.slug}` : "/businesses";

  return <div className={styles.page}><header className={styles.siteHeader}><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><nav><Link className={styles.active} href="/businesses">Find a business</Link><Link href="/login">List your business</Link></nav></header><main><div className={styles.breadcrumb}><Link href="/">Service Plaza</Link><span>/</span>{fixedCategory ? <><Link href="/businesses">Businesses</Link><span>/</span><span>{fixedCategory.name}</span></> : <span>Businesses</span>}</div><section className={styles.intro}><p className={styles.eyebrow}>UK-based specialists</p><h1>{fixedCategory?.name ?? "Find the right business for you"}</h1><p>{fixedCategory?.description ?? "Search and browse independent UK-based businesses offering professional, practical and personal services."}</p></section>
    <nav className={styles.categoryLinks} aria-label="Browse business categories"><Link className={!selectedCategory ? styles.selectedCategory : ""} href="/businesses">All businesses</Link>{categories.map((category) => <Link className={selectedCategory === category.slug ? styles.selectedCategory : ""} href={`/businesses/${category.slug}`} key={category.slug}>{category.name}</Link>)}</nav>
    <div className={styles.directoryLayout}>
      <aside className={styles.filterSidebar}><form className={styles.filters} action={action}><header className={styles.filterHeading}><p className={styles.eyebrow}>Refine your search</p><h2>Find a business</h2></header><div className={styles.searchRow}><label><span>What are you looking for?</span><input name="q" defaultValue={clean(query.q)} placeholder="Business name, service or specialism"/></label><label><span>Location</span><input name="location" defaultValue={clean(query.location)} placeholder="Town, city, county or region"/></label></div>{!fixedCategory ? <label><span>Category</span><select name="category" defaultValue={selectedCategory}><option value="">All categories</option>{categories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label> : null}<fieldset><legend>How they work</legend><label><input type="checkbox" name="online" value="1" defaultChecked={query.online === "1"}/> Online</label><label><input type="checkbox" name="inPerson" value="1" defaultChecked={query.inPerson === "1"}/> In person</label><label><input type="checkbox" name="perk" value="1" defaultChecked={query.perk === "1"}/> Plaza Perk available</label></fieldset><div className={styles.filterActions}><label><span>Sort by</span><select name="sort" defaultValue={sort}><option value="az">Business name: A–Z</option><option value="recent">Most recently added</option></select></label><button type="submit">Show businesses</button><Link href={action}>Clear filters</Link></div></form></aside>
      <section className={styles.results}><header><div><p className={styles.eyebrow}>Directory results</p><h2>{filtered.length} {filtered.length === 1 ? "business" : "businesses"}</h2></div><span>{sort === "recent" ? "Most recently added first" : "Alphabetical order"}</span></header>{filtered.length ? <div className={styles.grid}>{filtered.map((listing) => <BusinessCard listing={listing} key={listing.id}/>)}</div> : <div className={styles.empty}><h2>No businesses match those filters yet</h2><p>Try a broader search, remove a filter or explore another category.</p><Link href={action}>Clear filters</Link></div>}</section>
    </div></main><footer><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><p>Independent UK-based service businesses, brought together.</p><Link href="/login">List or manage a business</Link></footer></div>;
}
