"use server";
import { createClient } from "@/lib/supabase/server";

export type BusinessBasics = { versionId: string; businessName: string; shortSummary: string; fullDescription: string };
export type SaveResult = { ok: true } | { ok: false; message: string };
export type ListingTaxonomy = {
  versionId: string; primaryCategoryId: string | null; additionalCategoryIds: string[];
  serviceTagIds: string[]; customServices: string[]; categoryHelpRequested: boolean; categoryHelpText: string;
};
export type BasicInformation = ListingTaxonomy & { applicantName: string; businessName: string };

export async function saveBusinessBasics(input: BusinessBasics): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId)) return { ok: false, message: "This draft could not be identified." };
  const values = {
    business_name: input.businessName.trim(),
    short_summary: input.shortSummary.trim(),
    full_description: input.fullDescription.trim(),
  };
  if (values.business_name.length > 160 || values.short_summary.length > 160 || values.full_description.length > 2000) {
    return { ok: false, message: "One or more fields is too long." };
  }
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { data, error } = await supabase.from("listing_versions").update(values)
    .eq("id", input.versionId).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "We couldn’t save your changes. Please try again." };
  return { ok: true };
}

export async function saveListingTaxonomy(input: ListingTaxonomy): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId)) return { ok: false, message: "This draft could not be identified." };
  if (input.additionalCategoryIds.length > 2) return { ok: false, message: "Choose no more than two additional categories." };
  if (input.serviceTagIds.length > 8) return { ok: false, message: "Choose no more than eight service tags." };
  if (input.customServices.length > 15 || input.customServices.some((service) => service.trim().length > 80)) return { ok: false, message: "Add no more than 15 services, using up to 80 characters for each." };
  if (input.categoryHelpText.length > 1000) return { ok: false, message: "Your category request is too long." };
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { error } = await supabase.rpc("save_listing_taxonomy", {
    target_version_id: input.versionId, primary_category_id: input.primaryCategoryId,
    additional_category_ids: input.additionalCategoryIds, selected_service_tag_ids: input.serviceTagIds,
    custom_service_names: input.customServices, help_requested: input.categoryHelpRequested,
    help_text: input.categoryHelpText,
  });
  if (error) return { ok: false, message: "We couldn’t save your category and services. Please try again." };
  return { ok: true };
}

export async function saveBasicInformation(input: BasicInformation): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId)) return { ok: false, message: "This draft could not be identified." };
  if (!input.applicantName.trim() || input.applicantName.trim().length > 120) return { ok: false, message: "Enter your name using no more than 120 characters." };
  if (!input.businessName.trim() || input.businessName.trim().length > 160) return { ok: false, message: "Enter your business name using no more than 160 characters." };
  if (!input.categoryHelpRequested && !input.primaryCategoryId) return { ok: false, message: "Choose a primary category or tell us that you can’t find the right one." };
  if (input.categoryHelpRequested && !input.categoryHelpText.trim()) return { ok: false, message: "Please briefly describe the category or service you need." };
  if (input.additionalCategoryIds.length > 2 || input.serviceTagIds.length > 8 || input.customServices.length > 15) return { ok: false, message: "One or more selections exceeds the permitted limit." };
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { error } = await supabase.rpc("save_basic_information", {
    target_version_id: input.versionId, applicant_name: input.applicantName,
    listing_business_name: input.businessName, primary_category_id: input.primaryCategoryId,
    additional_category_ids: input.additionalCategoryIds, selected_service_tag_ids: input.serviceTagIds,
    custom_service_names: input.customServices, help_requested: input.categoryHelpRequested,
    help_text: input.categoryHelpText,
  });
  if (error) return { ok: false, message: "We couldn’t save your basic information. Please try again." };
  return { ok: true };
}
