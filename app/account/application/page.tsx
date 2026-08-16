import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessBasicsForm } from "./business-basics-form";
import { CategoryServicesForm } from "./category-services-form";
import styles from "./application.module.css";

export default async function ApplicationPage() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getClaims();
  if (error || !auth?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", auth.claims.sub).maybeSingle();
  if (!business) redirect("/account");
  const { data: listing } = await supabase.from("listings").select("id").eq("business_id", business.id).maybeSingle();
  if (!listing) redirect("/account");
  const { data: draft } = await supabase.from("listing_versions").select("id, business_name, short_summary, full_description, category_help_requested, category_help_text").eq("listing_id", listing.id).eq("status", "draft").maybeSingle();
  if (!draft) redirect("/account");

  const [{ data: categories }, { data: serviceTags }, { data: assignments }, { data: selectedTags }, { data: services }] = await Promise.all([
    supabase.from("categories").select("id, name, description").eq("is_active", true).order("sort_order"),
    supabase.from("service_tags").select("id, category_id, name").eq("is_active", true).order("sort_order"),
    supabase.from("listing_category_assignments").select("category_id, is_primary").eq("listing_version_id", draft.id),
    supabase.from("listing_service_tags").select("service_tag_id").eq("listing_version_id", draft.id),
    supabase.from("listing_services").select("name").eq("listing_version_id", draft.id).order("sort_order"),
  ]);
  const primaryCategoryId = assignments?.find((assignment) => assignment.is_primary)?.category_id ?? null;

  return <main className={styles.main}><div className={styles.shell}>
    <Link className={styles.backLink} href="/account">← Business account</Link>
    <header className={styles.header}><div><p className={styles.eyebrow}>Your application</p><h1>Tell us about your business</h1></div><p>2 sections available</p></header>
    <p className={styles.intro}>Build your listing one section at a time. Your progress saves automatically and remains private until submission.</p>
    <section className={styles.section}><div className={styles.sectionHeading}><p className={styles.eyebrow}>Application · Section 1</p><h2>Business basics</h2></div>
      <BusinessBasicsForm versionId={draft.id} initialValues={{ businessName: draft.business_name, shortSummary: draft.short_summary, fullDescription: draft.full_description }} />
    </section>
    <CategoryServicesForm versionId={draft.id}
      categories={(categories ?? []).map((category) => ({ id: category.id, name: category.name, description: category.description }))}
      serviceTags={(serviceTags ?? []).map((tag) => ({ id: tag.id, categoryId: tag.category_id, name: tag.name }))}
      initialValues={{ primaryCategoryId, additionalCategoryIds: (assignments ?? []).filter((assignment) => !assignment.is_primary).map((assignment) => assignment.category_id), serviceTagIds: (selectedTags ?? []).map((tag) => tag.service_tag_id), customServices: (services ?? []).map((service) => service.name), categoryHelpRequested: draft.category_help_requested, categoryHelpText: draft.category_help_text ?? "" }} />
  </div></main>;
}
