import Link from "next/link";
import styles from "./application.module.css";

export function SectionPlaceholder({ number, title, intro, previous, next }: {
  number: number; title: string; intro: string; previous: string; next?: string;
}) {
  return <><header className={styles.header}><div><p className={styles.eyebrow}>Application · Section {number} of 6</p><h1>{title}</h1></div></header>
    <p className={styles.intro}>{intro}</p>
    <section className={`${styles.form} ${styles.placeholderCard}`}><p>This section is ready in the application journey and will be completed next.</p>
      <div className={styles.formNavigation}><Link className={styles.secondaryLink} href={previous}>Back</Link>{next ? <Link className={styles.primaryLink} href={next}>Continue</Link> : null}</div>
    </section></>;
}
