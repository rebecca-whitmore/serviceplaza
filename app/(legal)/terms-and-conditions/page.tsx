import type { Metadata } from "next";
import { LegalDocument } from "../legal-document";
export const metadata: Metadata = { title: "Terms & Conditions | Service Plaza" };
export default function TermsPage() { return <LegalDocument file="terms.md" eyebrow="Using Service Plaza" title="Terms & Conditions" summary="The terms that apply when you browse, create an account or publish a business listing."/>; }
