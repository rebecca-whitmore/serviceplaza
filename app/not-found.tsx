import Link from "next/link";
import { PublicFooter } from "@/app/components/public-footer";
import styles from "./not-found.module.css";

export default function NotFound() {
  return <main className={styles.page}>
    <header className={styles.header}><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><nav aria-label="Main navigation"><Link href="/">Home</Link><Link href="/businesses">Browse businesses</Link><Link href="/find-a-service">Find a service</Link><Link href="/login">List your business</Link></nav></header>
    <section className={styles.content}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Page not found · 404</p>
        <h1>UH OH. This page is not here.</h1>
        <p>Let’s take you somewhere useful.</p>
        <div className={styles.actions}><Link className={styles.primary} href="/">Return to the homepage <span aria-hidden="true">→</span></Link><Link className={styles.secondary} href="/businesses">Browse the directory</Link></div>
      </div>
      <div className={styles.art} aria-hidden="true"><div className={styles.orbit}/><div className={styles.diamond}><span>404</span><small>Service Plaza</small></div><i/><i/><i/></div>
    </section>
    <PublicFooter />
  </main>;
}
