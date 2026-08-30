import Link from "next/link";
import styles from "./public-footer.module.css";

export function PublicFooter() {
  return <div className={styles.footer} role="contentinfo">
    <div className={styles.inner}>
      <div className={styles.identity}><Link className={styles.brand} href="/"><span><i>SP</i></span><strong>Service Plaza</strong></Link><p>Independent professionals.<br/>Meaningful work. UK-wide locations.</p></div>
      <nav className={styles.links} aria-label="Footer navigation">
        <div><Link href="/businesses">Browse businesses</Link><Link href="/find-a-service">Find a service</Link><Link href="/about">About Service Plaza</Link></div>
        <div><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/privacy-policy">Privacy Policy</Link><Link href="/cookie-policy">Cookie Policy</Link></div>
        <div><Link href="/login">List Your Business</Link><a href="mailto:admin@serviceplaza.co.uk">ADMIN@SERVICEPLAZA.CO.UK</a></div>
      </nav>
    </div>
  </div>;
}
