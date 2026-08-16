"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { applicationSteps } from "./application-steps";
import styles from "./application.module.css";

export function ApplicationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <main className={styles.main}><div className={styles.shell}>
    <Link className={styles.backLink} href="/account">← Business account</Link>
    <nav className={styles.progress} aria-label="Application sections"><ol>
      {applicationSteps.map((step) => {
        const href = `/account/application/${step.slug}`;
        const current = pathname === href;
        return <li key={step.slug}><Link href={href} className={current ? styles.currentStep : ""} aria-current={current ? "step" : undefined}><span>{step.number}</span><small>{step.label}</small></Link></li>;
      })}
    </ol></nav>
    {children}
  </div></main>;
}
