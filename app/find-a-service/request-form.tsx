"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Forminit } from "forminit";
import styles from "./find-a-service.module.css";

export function ServiceRequestForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const forminit = new Forminit({ proxyUrl: "/api/forminit" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    const form = event.currentTarget;

    try {
      const { error } = await forminit.submit("hrbw92ywoyu", new FormData(form));
      if (error) {
        setStatus("error");
        setErrorMessage(error.message || "We couldn’t send your request. Please check your details and try again.");
        return;
      }
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("We couldn’t send your request. Please try again, or email admin@serviceplaza.co.uk if the problem continues.");
    }
  }

  if (status === "success") {
    return <section className={[styles.form, styles.successPanel].join(" ")} aria-live="polite">
      <p className={styles.eyebrow}>Request received</p>
      <h2>Thank you. We’ll take it from here.</h2>
      <p>Your request has been sent securely to Service Plaza. A member of our team will review it and aims to respond within 24 hours. We may contact you first if we need to clarify anything.</p>
      <Link href="/businesses">Return to the directory</Link>
    </section>;
  }

  return <form className={styles.form} onSubmit={handleSubmit}>
    <div className={styles.formIntro}>
      <p className={styles.eyebrow}>Your request</p>
      <h2>Tell us what would help.</h2>
      <p>Share as much as you can. If anything needs clarifying, a member of the Service Plaza team may contact you before we begin the search.</p>
    </div>

    <div className={styles.fieldGrid}>
      <label><span>Your name</span><input name="fi-sender-fullName" type="text" autoComplete="name" required /></label>
      <label><span>Email address</span><input name="fi-sender-email" type="email" autoComplete="email" required /></label>
      <label><span>Contact number</span><input name="fi-text-contactNumber" type="tel" autoComplete="tel" required /></label>
      <label><span>Your postcode or location</span><input name="fi-text-location" type="text" autoComplete="postal-code" placeholder="For example, CH1 or Chester" required /></label>
      <label className={styles.fullField}><span>What service are you looking for?</span><input name="fi-text-service" type="text" placeholder="For example, a family photographer or an independent financial adviser" required /></label>
      <label><span>When do you need help?</span><select name="fi-select-timeframe" defaultValue="" required><option value="" disabled>Select a timeframe</option><option>As soon as possible</option><option>Within the next few weeks</option><option>Within the next few months</option><option>I am researching for later</option><option>I am flexible</option></select></label>
      <label><span>How could the service be provided?</span><select name="fi-select-delivery" defaultValue="" required><option value="" disabled>Select an option</option><option>In person</option><option>Online</option><option>Either would work</option><option>Not sure</option></select></label>
      <label><span>Budget, if known <small>Optional</small></span><input name="fi-text-budget" type="text" placeholder="A range or maximum is helpful" /></label>
      <label><span>Preferred way to hear from us</span><select name="fi-select-contactPreference" defaultValue="Email"><option>Email</option><option>Telephone</option><option>Either is fine</option></select></label>
      <label className={styles.fullField}><span>Tell us more about what you need</span><textarea name="fi-text-details" rows={8} placeholder="What matters most to you? Include any useful context, requirements or questions you would like us to consider." required /></label>
    </div>

    <label className={styles.permission}>
      <input type="checkbox" name="fi-checkbox-privacyAcknowledgement" value="Acknowledged" required />
      <span>I have read the <Link href="/privacy-policy">Privacy Policy</Link> and understand that Service Plaza will use these details to respond to my request. My information will not be shared with a professional without Service Plaza speaking with me first.</span>
    </label>

    {status === "error" ? <p className={styles.formError} role="alert">{errorMessage}</p> : null}
    <div className={styles.submitArea}>
      <button type="submit" disabled={status === "loading"}>{status === "loading" ? "Sending request…" : "Send my request"}</button>
      <p>Your request is sent securely to Service Plaza. We aim to respond within 24 hours.</p>
    </div>
  </form>;
}
