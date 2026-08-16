import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactDetailsForm } from "./contact-details-form";
import styles from "../application.module.css";

function readSocialLinks(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

export default async function ContactDetailsPage() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getClaims();
  if (error || !auth?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id, contact_name, contact_email").eq("owner_user_id", auth.claims.sub).maybeSingle();
  if (!business) redirect("/account");
  const { data: listing } = await supabase.from("listings").select("id").eq("business_id", business.id).maybeSingle();
  if (!listing) redirect("/account");
  const { data: draft } = await supabase.from("listing_versions").select("id, public_contact_name, public_email, show_public_email, public_phone, show_public_phone, website_url, social_links").eq("listing_id", listing.id).eq("status", "draft").maybeSingle();
  if (!draft) redirect("/account");

  return <><header className={styles.header}><div><h1>Contact details</h1></div></header>
    <p className={styles.intro}>Tell us how prospective customers can contact your business, and choose exactly which direct details may appear publicly.</p>
    <ContactDetailsForm versionId={draft.id} initialValues={{
      publicContactName: draft.public_contact_name ?? business.contact_name,
      publicEmail: draft.public_email ?? business.contact_email,
      showPublicEmail: draft.show_public_email,
      publicPhone: draft.public_phone ?? "",
      showPublicPhone: draft.show_public_phone,
      websiteUrl: draft.website_url ?? "",
      socialLinks: readSocialLinks(draft.social_links),
    }} />
  </>;
}
