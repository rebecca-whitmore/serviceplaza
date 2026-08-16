import { requireAdmin } from "@/lib/admin/require-admin";
import styles from "./admin.module.css";

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const { data: versions, error } = await supabase.from("listing_versions").select("id, listing_id, business_name, status, submitted_at, updated_at").in("status", ["pending", "changes_requested"]).order("submitted_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error("Unable to load the administrator review queue.", { cause: error });
  const listingIds = [...new Set((versions ?? []).map((version) => version.listing_id))];
  const { data: listings } = listingIds.length ? await supabase.from("listings").select("id, business_id").in("id", listingIds) : { data: [] };
  const businessIds = [...new Set((listings ?? []).map((listing) => listing.business_id))];
  const { data: businesses } = businessIds.length ? await supabase.from("businesses").select("id, contact_name, contact_email").in("id", businessIds) : { data: [] };
  const rows = (versions ?? []).map((version) => { const listing = listings?.find((item) => item.id === version.listing_id); const business = businesses?.find((item) => item.id === listing?.business_id); return { ...version, contactName: business?.contact_name, contactEmail: business?.contact_email }; });
  const pendingCount = rows.filter((row) => row.status === "pending").length; const changesCount = rows.filter((row) => row.status === "changes_requested").length;

  return <><header className={styles.header}><div><p className={styles.eyebrow}>Private administration</p><h1>Review queue</h1></div><p>Applications submitted by business users appear here for private Service Plaza review.</p></header>
    <section className={styles.stats} aria-label="Queue totals"><div className={styles.stat}><strong>{pendingCount}</strong><span>Awaiting first review</span></div><div className={styles.stat}><strong>{changesCount}</strong><span>Changes requested</span></div><div className={styles.stat}><strong>{rows.length}</strong><span>Active review records</span></div></section>
    <section className={styles.queue}><header className={styles.queueHeader}><h2>Applications</h2><span>Oldest submissions first</span></header>{rows.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Business</th><th>Applicant</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><div className={styles.businessName}><strong>{row.business_name || "Unnamed business"}</strong><span>{row.id}</span></div></td><td><div className={styles.businessName}><strong>{row.contactName ?? "Not provided"}</strong><span>{row.contactEmail ?? "No email"}</span></div></td><td>{formatDate(row.submitted_at ?? row.updated_at)}</td><td><span className={styles.status}>{row.status === "pending" ? "Awaiting review" : "Changes requested"}</span></td></tr>)}</tbody></table></div> : <div className={styles.empty}><strong>No applications are awaiting review.</strong><p>Your first submitted test application will appear here.</p></div>}</section>
    <p className={styles.nextNote}>The next stage will add the private application detail page and the Approve, Request changes and Decline decisions.</p>
  </>;
}
