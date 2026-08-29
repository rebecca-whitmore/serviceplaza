"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./listing.module.css";

export function EnquiryForm({ slug, businessName }: { slug: string; businessName: string }) {
  const startedAt = useRef(0);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => { startedAt.current = Date.now(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/listing-enquiries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: data.get("name"), email: data.get("email"), phone: data.get("phone"), preferredContact: data.get("preferredContact"), message: data.get("message"), privacyAccepted: data.get("privacyAccepted") === "yes", website: data.get("website"), startedAt: startedAt.current }),
      });
      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) { setStatus("error"); setMessage(result.message || "We couldn’t send your enquiry. Please try again."); return; }
      form.reset(); setStatus("success");
    } catch { setStatus("error"); setMessage("We couldn’t send your enquiry. Please check your connection and try again."); }
  }

  if (status === "success") return <div className={styles.enquirySuccess} role="status"><strong>Your enquiry has been sent.</strong><p>{businessName} has received your details and can respond to you directly.</p><button type="button" onClick={() => { startedAt.current = Date.now(); setStatus("idle"); }}>Send another enquiry</button></div>;

  return <form className={styles.enquiryForm} onSubmit={submit}>
    <p className={styles.enquiryIntro}>Send a private enquiry directly to this business.</p>
    <label><span>Your name</span><input name="name" autoComplete="name" maxLength={120} required /></label>
    <label><span>Email address</span><input name="email" type="email" autoComplete="email" maxLength={320} required /></label>
    <label><span>Contact number <small>Optional</small></span><input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
    <label><span>How would you prefer a reply?</span><select name="preferredContact" defaultValue="email"><option value="email">Email</option><option value="telephone">Telephone</option><option value="either">Either is fine</option></select></label>
    <label><span>What would you like help with?</span><textarea name="message" rows={6} minLength={20} maxLength={3000} required /></label>
    <label className={styles.enquiryConsent}><input name="privacyAccepted" type="checkbox" value="yes" required /><span>I have read the <Link href="/privacy-policy">Privacy Policy</Link> and agree to my details being sent to this business so they can respond.</span></label>
    <label className={styles.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    {status === "error" ? <p className={styles.enquiryError} role="alert">{message}</p> : null}
    <button className={styles.enquirySubmit} type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send enquiry"}</button>
  </form>;
}
