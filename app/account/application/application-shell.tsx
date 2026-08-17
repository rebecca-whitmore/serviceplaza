"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { applicationSteps } from "./application-steps";
import styles from "./application.module.css";
import bannerStyles from "./change-request.module.css";
import { signOut } from "../actions";

export function ApplicationShell({ children, changeRequestMessage }: { children: React.ReactNode; changeRequestMessage?: string | null }) {
  const pathname = usePathname();
  return <main className={styles.main}><div className={styles.shell}>
    <div className={styles.accountBar}><Link className={styles.backLink} href="/account">← Business account</Link><form action={signOut}><button className={styles.signOutButton} type="submit">Sign out</button></form></div>
    <nav className={styles.progress} aria-label="Application sections"><ol>
      {applicationSteps.map((step) => {
        const href = `/account/application/${step.slug}`;
        const current = pathname === href;
        return <li key={step.slug}><Link href={href} className={current ? styles.currentStep : ""} aria-current={current ? "step" : undefined}><span>{step.number}</span><small>{step.label}</small></Link></li>;
      })}
    </ol></nav>
    {changeRequestMessage ? <aside className={bannerStyles.notice}><strong>Service Plaza has requested changes</strong><p>{changeRequestMessage}</p></aside> : null}
    {children}
  </div></main>;
}
