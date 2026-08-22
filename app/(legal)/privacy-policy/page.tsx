import type { Metadata } from "next";
import { LegalDocument } from "../legal-document";
export const metadata: Metadata = { title: "Privacy Policy | Service Plaza" };
export default function PrivacyPolicyPage() { return <LegalDocument file="privacy.md" eyebrow="Your information" title="Privacy Policy" summary="How we collect, use and protect personal data across the Service Plaza directory."/>; }
