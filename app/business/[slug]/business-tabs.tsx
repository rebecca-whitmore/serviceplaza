"use client";

import { useState } from "react";
import styles from "./listing.module.css";

export function BusinessTabs({ businessName, fullDescription, founderStory }: { businessName: string; fullDescription: string; founderStory: string | null }) {
  const [activeTab, setActiveTab] = useState<"business" | "founder">("business");
  const hasFounderStory = founderStory && founderStory.trim().length > 0;

  return <section className={styles.section}>
    <div className={styles.tabContainer}>
      <div className={styles.tabButtons}>
        <button className={`${styles.tabButton} ${activeTab === "business" ? styles.tabButtonActive : ""}`} onClick={() => setActiveTab("business")} aria-selected={activeTab === "business"} role="tab">
          <p className={styles.kicker}>Meet the business</p>
        </button>
        {hasFounderStory ? <button className={`${styles.tabButton} ${activeTab === "founder" ? styles.tabButtonActive : ""}`} onClick={() => setActiveTab("founder")} aria-selected={activeTab === "founder"} role="tab">
          <p className={styles.kicker}>Meet the founder</p>
        </button> : null}
      </div>
    </div>

    {activeTab === "business" ? <div role="tabpanel">
      <h2>About {businessName}</h2>
      <div className={styles.longCopy}>{fullDescription?.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    </div> : null}

    {activeTab === "founder" && hasFounderStory ? <div role="tabpanel">
      <h2>About the founder</h2>
      <div className={styles.longCopy}>{founderStory?.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    </div> : null}
  </section>;
}
