"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./cookie-consent.module.css";

const CONSENT_KEY = "service-plaza-cookie-consent";

type Consent = "accepted" | "rejected" | null;

export function CookieConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const previousPath = useRef(pathname);

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
    if (consent !== "accepted" || previousPath.current === pathname) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "virtual_page_view", page_path: pathname });
    previousPath.current = pathname;
  }, [consent, pathname]);

  function choose(nextConsent: Exclude<Consent, null>) {
    const wasAccepted = consent === "accepted";
    window.localStorage.setItem(CONSENT_KEY, nextConsent);
    setAnalyticsDisabled(nextConsent !== "accepted");
    if (nextConsent === "rejected") removeAnalyticsCookies();
    setConsent(nextConsent);
    setSettingsOpen(false);
    if (wasAccepted && nextConsent === "rejected") window.location.reload();
  }

  const showPanel = ready && (consent === null || settingsOpen);

  return <>
    {consent === "accepted" ? <>
      <Script id="service-plaza-google-tag-manager" strategy="afterInteractive">{"(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-T84QPCHG');"}</Script>
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
    "ga-disable-G-EWY1ESPG0B"?: boolean;
  }
}
