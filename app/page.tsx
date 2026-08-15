import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.intro} aria-labelledby="page-title">
        <p className={styles.eyebrow}>A new UK-wide directory</p>
        <h1 id="page-title">Service Plaza</h1>
        <p className={styles.summary}>
          A welcoming place to discover independent, trust-led service
          businesses.
        </p>
        <p className={styles.status}>We&apos;re currently building the plaza.</p>
      </section>
    </main>
  );
}
