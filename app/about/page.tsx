import type { Metadata } from "next";
import Link from "next/link";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About Service Plaza | A Directory Built Around Trust",
  description: "Discover why Service Plaza brings together independent UK professionals and the people who care about choosing them well.",
  alternates: { canonical: "/about" },
};

const reviewPoints = [
  { number: "01", title: "Purpose", copy: "Are they here to offer a genuine service, not to recruit others into a scheme?" },
  { number: "02", title: "Accountability", copy: "Is there a real, consistent point of contact who stands behind the work, even if they lead a team?" },
  { number: "03", title: "Commitment", copy: "Are they serious about what they do? We look at reviews, the quality of their work, and how active and current their presence is." },
];

export default function AboutPage() {
  return <div className={styles.page} id="top">
    <header className={styles.header}>
      <Link className={styles.brand} href="/"><span><i>SP</i></span><strong>Service Plaza</strong></Link>
      <nav aria-label="Main navigation"><Link href="/businesses">Browse businesses</Link><Link href="/find-a-service">Find a service</Link><Link className={styles.ownerLink} href="/login">List your business</Link></nav>
    </header>

    <main>
      <section className={styles.hero}>
        <div className={styles.heroCopy}><p className={styles.eyebrow}>About Service Plaza</p><h1>A directory built around trust, not just listings.</h1><p className={styles.lead}>Service Plaza is a growing directory of independent UK professionals — people you can find, get to know, and choose with confidence.</p><p>Whether you&apos;re looking for someone local, someone remote, or someone who&apos;ll come to you, we help you discover the person behind the business, not just another name in a search result.</p></div>
        <div className={styles.heroArt} aria-hidden="true"><div className={styles.orbit}/><div className={styles.heroMark}><span>SP</span><small>People before listings</small></div><i/><i/><i/></div>
      </section>

      <section className={styles.origin}>
        <div><p className={styles.eyebrow}>Why it exists</p><h2>Built for people who take pride in their work.</h2></div>
        <div className={styles.longCopy}><p>Service Plaza started with a simple observation: finding a good independent professional shouldn&apos;t mean wading through crowded marketplaces, faceless listings, or being asked for your phone number before you&apos;ve even had a look around.</p><p>We wanted to build something different — a place where independent providers could be found on their own merit, and where customers could browse freely, with no pressure and no gatekeeping.</p><p>What started as an idea has grown into something we&apos;re genuinely proud of: a home for professionals who care about their reputation, and for the people looking to work with them.</p></div>
      </section>

      <section className={styles.difference}>
        <div className={styles.differenceHeading}><p className={styles.eyebrow}>What makes us different</p><h2>No pressure.<br/>No gatekeeping.<br/><em>No pretending.</em></h2></div>
        <div className={styles.differenceCopy}><p>Unlike many directories, you won&apos;t need to hand over your email or phone number just to start browsing. Look around, take your time, and reach out only when you&apos;re ready.</p><p>We&apos;re not organised around industries alone — we&apos;re organised around character. The professionals listed here are freelancers and small business owners for whom reputation is everything. They&apos;re not chasing a quick sale; they care about getting it right for their clients.</p><p>That could be a VA, a personal trainer, a travel agent, a beautician — working remotely, in person, or on the move. What connects them isn&apos;t the service. It&apos;s the pride they take in doing it well.</p></div>
      </section>

      <section className={styles.audience}>
        <header><p className={styles.eyebrow}>Who it&apos;s for</p><h2>For people who care about who they choose.</h2></header>
        <div className={styles.audienceGrid}><article><span>For customers</span><p>Service Plaza is for anyone who feels that the outcome matters — your health, your home, your money, your next chapter — and wants to know who they&apos;re trusting with it.</p></article><article><span>For professionals</span><p>It&apos;s also for the independent professionals behind these services: people building something of their own, who want to be found by the right customers, not just any customer.</p></article></div>
      </section>

      <section className={styles.review}>
        <header><p className={styles.eyebrow}>How we review listings</p><h2>Every listing is reviewed before it goes live.</h2><p>We don&apos;t open the doors to anyone. Before a business joins Service Plaza, we look at:</p></header>
        <div className={styles.reviewGrid}>{reviewPoints.map((point) => <article key={point.number}><span>{point.number}</span><h3>{point.title}</h3><p>{point.copy}</p></article>)}</div>
        <p className={styles.reviewClose}>If we don&apos;t think it&apos;s a good fit, we won&apos;t list it.</p>
      </section>

      <aside className={styles.honest}>
        <div className={styles.honestMark} aria-hidden="true">◇</div><div><p className={styles.eyebrow}>The honest bit</p><h2>We check who they are. The choice is always yours.</h2><p>Being listed on Service Plaza means a business has passed our checks for legitimacy and fit. It isn&apos;t a guarantee or endorsement of their work — we simply help you find people worth talking to. What happens next is between you and them.</p></div>
      </aside>

      <section className={styles.future}>
        <div><p className={styles.eyebrow}>Where we&apos;re headed</p><h2>The place to start, before you choose.</h2><p>We&apos;re growing this directory with one goal: to become the first place people check before choosing an independent professional in the UK — and a genuine source of new clients for the providers who deserve to be found.</p></div>
        <div className={styles.actions}><p>Ready to look around?</p><Link className={styles.primaryAction} href="/businesses">Browse the directory <span aria-hidden="true">→</span></Link><Link className={styles.secondaryAction} href="/login">List your business</Link></div>
      </section>
    </main>

    <footer className={styles.footer}><Link className={styles.brand} href="/"><span><i>SP</i></span><strong>Service Plaza</strong></Link><p>Independent UK-based service businesses, brought together.</p><nav aria-label="Footer navigation"><Link href="/businesses">Browse businesses</Link><Link href="/find-a-service">Find a service</Link><Link href="/about">About Service Plaza</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/cookie-policy">Cookie Policy</Link><Link href="/privacy-policy">Privacy Policy</Link><a href="mailto:admin@serviceplaza.co.uk">admin@serviceplaza.co.uk</a><Link href="/login">Business account</Link></nav></footer>
    <a className={styles.scrollTop} href="#top" aria-label="Back to the top of the page"><span aria-hidden="true">↑</span></a>
  </div>;
}
