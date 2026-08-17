import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import styles from "./admin.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return <main className={styles.main}><div className={styles.shell}><header className={styles.topbar}><div className={styles.brand}><strong>Service Plaza</strong><span>Administrator</span></div><nav><Link href="/admin">Review queue</Link><Link href="/admin/listings">Listings</Link><Link href="/account">Business account</Link></nav><span className={styles.muted}>{profile.full_name ?? "Administrator"}</span></header>{children}</div></main>;
}
