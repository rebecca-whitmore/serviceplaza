import type { Metadata } from "next";
import Link from "next/link";
import styles from "./home-preview/home-preview.module.css";

export const metadata: Metadata = {
  title: "Service Plaza | Find Independent UK Professionals",
  description: "Discover independent UK professionals, learn how they work and find someone you feel good about choosing.",
  alternates: { canonical: "/" },
};

const values = [
  { number: "01", title: "UK-based", copy: "Every business listed on Service Plaza is based in the UK, whether they work locally, online or across the country." },
  { number: "02", title: "Independent", copy: "Discover the people and specialist businesses behind valuable services—not an anonymous global marketplace." },
  { number: "03", title: "Thoughtfully curated", copy: "Listings are reviewed before publication, helping visitors browse with greater clarity and confidence." },
];

export default function HomePage() {
  return <div className={styles.page} id="top">
    <header className={styles.header}>
      <Link className={styles.brand} href="/"><span><i>SP</i></span><strong>Service Plaza</strong></Link>
      <nav aria-label="Main navigation"><Link href="/businesses">Browse businesses</Link><Link href="/find-a-service">Find a service</Link><Link className={styles.ownerLink} href="/login">List your business</Link></nav>
    </header>
    <main>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Look around. Take your time.</p>
          <h1>Find a business you feel good about choosing.</h1>
          <h2 className={styles.heroSubheading}>Because when the outcome matters to you, the person behind the business matters too.</h2>
          <div className={styles.heroIntro}><p>Some things are too personal, important or expensive to leave to a faceless brand. Whether it&apos;s your health, your home, your money or your next chapter, Service Plaza helps you discover independent UK professionals who are as invested in getting it right as you are.</p></div>
          <div className={styles.actions}><Link className={styles.primaryAction} href="/businesses">Browse the directory <span aria-hidden="true">→</span></Link><a className={styles.textAction} href="#about">Discover what makes us different</a></div>
        </div>
        <div className={styles.heroVisual} aria-label="A selection of the types of businesses found on Service Plaza">
          <div className={`${styles.serviceCard} ${styles.cardOne}`}><span>Marketing &amp; PR</span><strong>Find specialists who help your business get seen.</strong></div>
          <div className={`${styles.serviceCard} ${styles.cardTwo}`}><span>Health &amp; Wellbeing</span><strong>Explore support designed around real people.</strong></div>
          <div className={`${styles.serviceCard} ${styles.cardThree}`}><span>Web &amp; Digital</span><strong>Meet UK experts who make technology feel simpler.</strong></div>
          <div className={styles.visualMark}><div><span>SP</span><small>Independent<br/>UK businesses</small></div></div>
        </div>
      </section>
      <section className={styles.introStrip} aria-label="Service Plaza introduction"><p>Independent professionals.</p><p>Meaningful work.</p><p>UK-wide locations.</p></section>
      <section className={styles.about} id="about"><div><p className={styles.eyebrow}>A better place to begin</p><h2>Great services should be easier to discover.</h2></div><div className={styles.aboutCopy}><p>Finding the right person for a job can mean searching through endless results, crowded marketplaces and businesses based anywhere in the world.</p><p>Service Plaza offers a more considered alternative: a growing directory where UK residents and businesses can discover independent providers, understand what they offer and connect with them directly.</p></div></section>
      <section className={styles.valuesSection}><header><p className={styles.eyebrow}>What we stand for</p><h2>Professional, personal and proudly UK-focused.</h2></header><div className={styles.values}>{values.map((value) => <article key={value.number}><span>{value.number}</span><h3>{value.title}</h3><p>{value.copy}</p></article>)}</div></section>
      <section className={styles.directoryCta}><div><p className={styles.eyebrow}>Ready to explore?</p><h2>Your next trusted specialist could be one click away.</h2></div><div className={styles.directoryActions}><Link className={styles.lightAction} href="/businesses">Find a business <span aria-hidden="true">→</span></Link><div className={styles.findServiceNote}><p>Can’t see what you need?</p><Link href="/find-a-service">Ask us to help you find it <span aria-hidden="true">→</span></Link></div></div></section>
      <section className={styles.ownerCta}><div><p className={styles.eyebrow}>For business owners</p><h2>Would your business feel at home here?</h2><p>Create a <strong>FREE</strong> business account and tell us about the services you offer. Every submission is reviewed before it joins the directory.</p></div><Link href="/login">Register or manage your listing</Link></section>
    </main>
    <footer className={styles.footer}><Link className={styles.brand} href="/"><span><i>SP</i></span><strong>Service Plaza</strong></Link><p>Independent UK-based service businesses, brought together.</p><div><Link href="/businesses">Browse businesses</Link><Link href="/find-a-service">Find a service</Link><Link href="/about">About Service Plaza</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/cookie-policy">Cookie Policy</Link><Link href="/privacy-policy">Privacy Policy</Link><a href="mailto:admin@serviceplaza.co.uk">admin@serviceplaza.co.uk</a><Link href="/login">Business account</Link></div></footer>
    <a className={styles.scrollTop} href="#top" aria-label="Back to the top of the page"><span aria-hidden="true">↑</span></a>
  </div>;
}
