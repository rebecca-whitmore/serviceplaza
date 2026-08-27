import type { Metadata } from "next";
import Link from "next/link";
import styles from "./about.module.css";

export const metadata: Metadata = { title: "About Service Plaza" };

export default function AboutPage() {
  return <div className={styles.page}><header><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><Link href="/businesses">Browse businesses</Link></header><main><div className={styles.title}><h1>About Service Plaza</h1></div><div className={styles.art} aria-hidden="true"><span/><span/><span/><div>SP</div></div></main><footer><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><nav aria-label="Footer navigation"><Link href="/about">About Service Plaza</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/cookie-policy">Cookie Policy</Link><Link href="/privacy-policy">Privacy Policy</Link><a href="mailto:admin@serviceplaza.co.uk">admin@serviceplaza.co.uk</a></nav></footer></div>;
}
