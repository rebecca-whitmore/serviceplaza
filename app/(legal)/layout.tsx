import Link from "next/link";
import styles from "./legal.module.css";

export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={styles.page}>
    <header><Link className={styles.brand} href="/home-preview"><span>SP</span><strong>Service Plaza</strong></Link><Link href="/businesses">Browse businesses</Link></header>
    <main>{children}</main>
    <footer><Link className={styles.brand} href="/home-preview"><span>SP</span><strong>Service Plaza</strong></Link><nav aria-label="Footer navigation"><Link href="/about">About Service Plaza</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/cookie-policy">Cookie Policy</Link><Link href="/privacy-policy">Privacy Policy</Link><a href="mailto:admin@serviceplaza.co.uk">admin@serviceplaza.co.uk</a></nav></footer>
  </div>;
}
