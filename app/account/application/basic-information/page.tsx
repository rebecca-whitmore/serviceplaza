import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BasicInformationForm } from "./basic-information-form";
import styles from "../application.module.css";

export default async function BasicInformationPage() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getClaims();
  if (error || !auth?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id, contact_name").eq("owner_user_id", auth.claims.sub).maybeSingle();
  if (!business) redirect("/account");
  const { data: listing } = await supabase.from("listings").select("id").eq("business_id", business.id).maybeSingle();
  if (!listing) redirect("/account");
  const { data: draft } = await supabase.from("listing_versions").select("id, business_name, category_help_requested, category_help_text").eq("listing_id", listing.id).eq("status", "draft").maybeSingle();
  if (!draft) redirect("/account");
  const [{ data: categories }, { data: serviceTags }, { data: assignments }, { data: selectedTags }, { data: services }] = await Promise.all([
    supabase.from("categories").select("id, name, description").eq("is_active", true).order("sort_order"),
    supabase.from("service_tags").select("id, category_id, name").eq("is_active", true).order("sort_order"),
    supabase.from("listing_category_assignments").select("category_id, is_primary").eq("listing_version_id", draft.id),
    supabase.from("listing_service_tags").select("service_tag_id").eq("listing_version_id", draft.id),
    supabase.from("listing_services").select("name").eq("listing_version_id", draft.id).order("sort_order"),
  ]);
  const primaryCategoryId = assignments?.find((assignment) => assignment.is_primary)?.category_id ?? null;

  return <><header className={styles.header}><div><p className={styles.eyebrow}>Application · Section 1 of 6</p><h1>Basic information &amp; services</h1></div></header>
    <p className={styles.intro}>Start with the essentials: who you are, your business name and the services customers can find you for.</p>
    <BasicInformationForm versionId={draft.id}
      categories={(categories ?? []).map(({ id, name, description }) => ({ id, name, description }))}
      serviceTags={(serviceTags ?? []).map((tag) => ({ id: tag.id, categoryId: tag.category_id, name: tag.name }))}
      initialValues={{ applicantName: business.contact_name, businessName: draft.business_name, primaryCategoryId, additionalCategoryIds: (assignments ?? []).filter((item) => !item.is_primary).map((item) => item.category_id), serviceTagIds: (selectedTags ?? []).map((item) => item.service_tag_id), customServices: (services ?? []).map((item) => item.name), categoryHelpRequested: draft.category_help_requested, categoryHelpText: draft.category_help_text ?? "" }} />
  </>;
}
