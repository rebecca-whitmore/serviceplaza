import type { Metadata } from "next";
import Link from "next/link";
import { ServiceRequestForm } from "./request-form";
import styles from "./find-a-service.module.css";

export const metadata: Metadata = {
  title: "Find a Service | Free Personal Search | Service Plaza",
  description: "Tell Service Plaza what you need and our team will help look for suitable independent UK professionals, free of charge.",
  alternates: { canonical: "/find-a-service" },
};

const steps = [
  { number: "01", title: "Tell us what you need", copy: "Describe the service, your location, timeframe and anything that matters to your decision." },
  { number: "02", title: "We review it personally", copy: "A member of the Service Plaza team will review your request and may contact you if we need to clarify anything." },
  { number: "03", title: "We begin the search", copy: "We will look for suitable independent UK professionals and aim to respond within 24 hours." },
];

export default function FindAServicePage() {
  return <div className={styles.page}>
    <header className={styles.siteHeader}><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><nav><Link href="/businesses">Browse businesses</Link><Link className={styles.active} href="/find-a-service">Find a service</Link><Link href="/login">List your business</Link></nav></header>
    <main>
      <div className={styles.breadcrumb}><Link href="/">Service Plaza</Link><span>/</span><span>Find a service</span></div>
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>A personal search service</p><h1>Can’t see what you’re looking for?</h1><p className={styles.lead}>Tell us what you need and Service Plaza will help look for suitable independent UK professionals.</p></div>
        <aside><span>Free to use</span><h2>A helping hand, without the endless searching.</h2><p>There is no charge to ask us for help. We aim to respond within 24 hours, although more specialist requests may take a little longer to research.</p></aside>
      </section>

      <section className={styles.process} aria-labelledby="process-title">
        <header><p className={styles.eyebrow}>What happens next</p><h2 id="process-title">A thoughtful search, handled by a real person.</h2></header>
        <div>{steps.map((step) => <article key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div>
        <p className={styles.expectation}>We cannot guarantee that we will find a suitable professional or that they will be available. We will never select someone solely because they have paid for a referral, and any decision to contact or appoint a professional remains yours.</p>
      </section>

      <section className={styles.formSection} id="request-form">
        <div className={styles.formAside}><p className={styles.eyebrow}>Before you begin</p><h2>A little detail helps us search well.</h2><p>Your request is reviewed privately by Service Plaza. We may get in touch with you first if we need to better understand what you are looking for.</p><ul><li>This service is completely free.</li><li>We aim to respond within 24 hours.</li><li>We will speak with you before sharing your details with a professional.</li><li>You are never obliged to contact or appoint anyone we find.</li></ul></div>
        <ServiceRequestForm />
      </section>
    </main>
    <footer><Link className={styles.brand} href="/"><span>SP</span><strong>Service Plaza</strong></Link><p>Independent UK-based service businesses, brought together.</p><nav aria-label="Footer navigation"><Link href="/businesses">Browse businesses</Link><Link href="/find-a-service">Find a service</Link><Link href="/about">About Service Plaza</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/cookie-policy">Cookie Policy</Link><Link href="/privacy-policy">Privacy Policy</Link><a href="mailto:admin@serviceplaza.co.uk">admin@serviceplaza.co.uk</a></nav></footer>
  </div>;
}
