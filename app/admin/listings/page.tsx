import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import styles from "./listings.module.css";

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/London" }).format(new Date(value)) : "Not recorded";
}

export default async function AdminListingsPage() {
  const { supabase } = await requireAdmin();
  const { data: listings, error } = await supabase.from("listings").select("id, business_id, current_published_version_id, publication_status, published_at, updated_at").not("current_published_version_id", "is", null).order("updated_at", { ascending: false });
  if (error) throw new Error("Unable to load approved listings.", { cause: error });
  const versionIds = (listings ?? []).map((listing) => listing.current_published_version_id).filter((id): id is string => Boolean(id));
  const businessIds = (listings ?? []).map((listing) => listing.business_id);
  const listingIds = (listings ?? []).map((listing) => listing.id);
  const [{ data: versions }, { data: businesses }, { data: updateVersions }, { data: internalFlags }] = await Promise.all([
    versionIds.length ? supabase.from("listing_versions").select("id, business_name, version_number, website_url").in("id", versionIds) : Promise.resolve({ data: [] }),
    businessIds.length ? supabase.from("businesses").select("id, contact_name, contact_email").in("id", businessIds) : Promise.resolve({ data: [] }),
    listingIds.length ? supabase.from("listing_versions").select("id, listing_id, status, version_number").in("listing_id", listingIds) : Promise.resolve({ data: [] }),
    listingIds.length ? supabase.from("listing_internal_flags").select("listing_id, website_opportunity").in("listing_id", listingIds) : Promise.resolve({ data: [] }),
  ]);

  const rows = (listings ?? []).map((listing) => {
    const latestVersion = updateVersions?.filter((version) => version.listing_id === listing.id).sort((a, b) => b.version_number - a.version_number)[0];
    const update = latestVersion && latestVersion.id !== listing.current_published_version_id && ["draft", "pending", "changes_requested"].includes(latestVersion.status) ? latestVersion : undefined;
    return { ...listing, version: versions?.find((version) => version.id === listing.current_published_version_id), business: businesses?.find((business) => business.id === listing.business_id), update, websiteOpportunity: internalFlags?.find((flag) => flag.listing_id === listing.id)?.website_opportunity ?? false };
  });

  return <><header className={styles.header}><div><p>Private administration</p><h1>Listings</h1></div><p>View and manage businesses with an approved listing.</p></header>
    <section className={styles.summary}><div><strong>{rows.filter((row) => row.publication_status === "published").length}</strong><span>Published</span></div><div><strong>{rows.filter((row) => row.publication_status === "hidden").length}</strong><span>Hidden</span></div><div><strong>{rows.filter((row) => row.update).length}</strong><span>Updates in progress</span></div></section>
    <section className={styles.panel}><header><h2>Approved listings</h2><span>{rows.length} total</span></header>{rows.length ? <div className={styles.tableWrap}><table><thead><tr><th>Business</th><th>Owner</th><th>Published</th><th>Visibility</th><th>Update</th><th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.version?.business_name || "Unnamed business"}</strong><small>Version {row.version?.version_number ?? "—"}</small>{!row.version?.website_url || row.websiteOpportunity ? <div className={styles.internalFlags}>{!row.version?.website_url ? <span className={styles.noWebsite}>No website</span> : null}{row.websiteOpportunity ? <span className={styles.websiteOpportunity}>Website opportunity</span> : null}</div> : null}</td><td><strong>{row.business?.contact_name ?? "Not provided"}</strong><small>{row.business?.contact_email ?? "No email"}</small></td><td>{formatDate(row.published_at)}</td><td><span className={row.publication_status === "published" ? styles.published : styles.hidden}>{row.publication_status === "published" ? "Published" : "Hidden"}</span></td><td>{row.update ? row.update.status === "pending" ? "Awaiting review" : row.update.status === "draft" ? "Owner editing" : "Changes requested" : "None"}</td><td><Link href={`/admin/listings/${row.id}`}>Manage</Link></td></tr>)}</tbody></table></div> : <div className={styles.empty}>No listings have been approved yet.</div>}</section>
  </>;
}
