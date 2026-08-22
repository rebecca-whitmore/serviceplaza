import type { Metadata } from "next";
import { LegalDocument } from "../legal-document";
export const metadata: Metadata = { title: "Cookie Policy | Service Plaza" };
export default function CookiePolicyPage() { return <LegalDocument file="cookies.md" eyebrow="Website information" title="Cookies Policy" summary="How Service Plaza uses essential cookies and similar technologies."/>; }
