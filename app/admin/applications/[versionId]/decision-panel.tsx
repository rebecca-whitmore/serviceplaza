"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { decideApplication, type AdminDecision } from "../actions";
import styles from "./decision.module.css";

const labels: Record<AdminDecision, { title: string; detail: string; button: string }> = {
  request_changes: { title: "Request changes", detail: "Keep this submitted version unchanged and create an editable copy for the business.", button: "Send change request" },
  approve: { title: "Approve & publish", detail: "Publish this exact reviewed version as the current public listing.", button: "Approve and publish" },
  decline: { title: "Decline", detail: "Close this application without publishing it.", button: "Decline application" },
};

export function DecisionPanel({ versionId }: { versionId: string }) {
  const router = useRouter(); const [decision, setDecision] = useState<AdminDecision | null>(null);
  const [applicantMessage, setApplicantMessage] = useState(""); const [privateNote, setPrivateNote] = useState("");
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("");
  const selected = decision ? labels[decision] : null; const messageRequired = decision === "request_changes" || decision === "decline";
  async function submit() {
    if (!decision) { setError("Choose a review decision before continuing."); return; }
    if (messageRequired && !applicantMessage.trim()) { setError("Add a message for the applicant."); return; }
    const warning = decision === "approve" ? "Approve and publish this application?" : decision === "decline" ? "Decline this application?" : "Send this change request and create a new editable draft?";
    if (!window.confirm(warning)) return;
    setSubmitting(true); setError(""); const result = await decideApplication({ versionId, decision, applicantMessage, privateNote });
    if (!result.ok) { setError(result.message); setSubmitting(false); return; }
    router.push("/admin"); router.refresh();
  }
  return <section className={styles.panel}><header><h2>Review decision</h2><p>Applicant messages become part of the review history. Private notes are visible only to administrators.</p></header>
    <div className={styles.choices}>{(Object.keys(labels) as AdminDecision[]).map((value) => <label className={decision === value ? styles.selected : ""} key={value}><input type="radio" name="decision" value={value} checked={decision === value} onChange={() => { setDecision(value); setError(""); }} /><span><strong>{labels[value].title}</strong><small>{labels[value].detail}</small></span></label>)}</div>
    <div className={styles.field}><div><label htmlFor="applicantMessage">Message to applicant {messageRequired ? <strong>(required)</strong> : <span>(optional)</span>}</label><span>{applicantMessage.length}/2,000</span></div><textarea id="applicantMessage" rows={5} maxLength={2000} value={applicantMessage} onChange={(event) => setApplicantMessage(event.target.value)} placeholder={decision === "approve" ? "Optional approval message" : "Explain the decision clearly and helpfully"} /></div>
    <div className={styles.field}><div><label htmlFor="privateNote">Private administrator note <span>(optional)</span></label><span>{privateNote.length}/4,000</span></div><textarea id="privateNote" rows={4} maxLength={4000} value={privateNote} onChange={(event) => setPrivateNote(event.target.value)} placeholder="Not included in applicant messages or public listing data" /></div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}<button className={`${styles.action} ${decision ? styles[decision] : ""}`} type="button" disabled={submitting || !decision} onClick={() => void submit()}>{submitting ? "Recording decision…" : selected?.button ?? "Choose a review decision"}</button>
  </section>;
}
