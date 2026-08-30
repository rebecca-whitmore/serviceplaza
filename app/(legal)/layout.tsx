import Link from "next/link";
import { PublicFooter } from "@/app/components/public-footer";
import styles from "./legal.module.css";

export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={styles.page}>
    <header><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><nav aria-label="Main navigation"><Link href="/businesses">Browse businesses</Link><Link href="/find-a-service">Find a service</Link><Link href="/login">List your business</Link></nav></header>
    <main>{children}</main>
    <PublicFooter />
  </div>;
}
