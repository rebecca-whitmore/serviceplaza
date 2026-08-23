"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./cookie-consent.module.css";

const CONSENT_KEY = "service-plaza-cookie-consent";
const MEASUREMENT_ID = "G-EWY1ESPG0B";

type Consent = "accepted" | "rejected" | null;

export function CookieConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    const storedConsent = stored === "accepted" || stored === "rejected" ? stored : null;
    // This client-only hydration step reads the visitor's previously stored choice.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(storedConsent);
    setAnalyticsDisabled(storedConsent !== "accepted");
    setReady(true);
  }, []);

  useEffect(() => {
    if (consent !== "accepted" || typeof window.gtag !== "function") return;
    window.gtag("config", MEASUREMENT_ID, { page_path: pathname });
  }, [consent, pathname]);

  function choose(nextConsent: Exclude<Consent, null>) {
    window.localStorage.setItem(CONSENT_KEY, nextConsent);
    setAnalyticsDisabled(nextConsent !== "accepted");
    if (nextConsent === "rejected") removeAnalyticsCookies();
    setConsent(nextConsent);
    setSettingsOpen(false);
  }

  const showPanel = ready && (consent === null || settingsOpen);

  return <>
    {consent === "accepted" ? <>
      <Script async src={"https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID} strategy="afterInteractive" />
      <Script id="service-plaza-google-analytics" strategy="afterInteractive">{"window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','G-EWY1ESPG0B',{page_path:window.location.pathname});"}</Script>
    </> : null}

    {showPanel ? <section className={styles.panel} aria-label="Cookie preferences" role="dialog" aria-modal="true">
      <div><strong>Cookies on Service Plaza</strong><p>We use necessary cookies to keep accounts secure. With your permission, we would also like to use Google Analytics to understand how people use the directory and improve it.</p><Link href="/cookie-policy">Read our Cookies Policy</Link></div>
      <div className={styles.actions}><button type="button" className={styles.reject} onClick={() => choose("rejected")}>Reject analytics</button><button type="button" className={styles.accept} onClick={() => choose("accepted")}>Accept analytics</button></div>
    </section> : null}

    {ready && !showPanel ? <button className={styles.settings} type="button" onClick={() => setSettingsOpen(true)} aria-label="Change cookie preferences">Cookie settings</button> : null}
  </>;
}

function setAnalyticsDisabled(disabled: boolean) {
  window["ga-disable-G-EWY1ESPG0B"] = disabled;
}

function removeAnalyticsCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name === "_ga" || name?.startsWith("_ga_")) {
      document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax";
      document.cookie = name + "=; Max-Age=0; path=/; domain=." + window.location.hostname + "; SameSite=Lax";
    }
  });
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    "ga-disable-G-EWY1ESPG0B"?: boolean;
  }
}
