"use server";
import { createClient } from "@/lib/supabase/server";
import { sendApplicationNotification } from "@/lib/email/application-notifications";
import { isCoverageMiles, lookupUkPostcode } from "@/lib/uk-postcodes";

export type BusinessBasics = { versionId: string; businessName: string; shortSummary: string; fullDescription: string };
export type SaveResult = { ok: true } | { ok: false; message: string };
export type ListingTaxonomy = {
  versionId: string; primaryCategoryId: string | null; additionalCategoryIds: string[];
  serviceTagIds: string[]; customServices: string[]; categoryHelpRequested: boolean; categoryHelpText: string;
};
export type BasicInformation = ListingTaxonomy & { applicantName: string; businessName: string };
export type ContactDetails = {
  versionId: string; publicContactName: string; publicEmail: string; showPublicEmail: boolean;
  publicPhone: string; showPublicPhone: boolean; websiteUrl: string;
  socialLinks: Record<string, string>;
};
export type AboutBusiness = { versionId: string; shortSummary: string; fullDescription: string; founderStory: string };
export type HowYouWork = {
  versionId: string; isUkBased: boolean; showBaseLocation: boolean;
  offersOnline: boolean; offersInPerson: boolean; servesLocal: boolean; servesUkWide: boolean;
  baseTownCity: string; ukRegion: string; businessPostcode: string;
  inPersonMode: "travels_to_customer" | "customers_visit" | "both" | "";
  travelRadiusMiles: number; inPersonNationwide: boolean;
};
export type StandOutDetails = {
  versionId: string; displayImagePublicly: boolean; imageAltText: string; hasPlazaPerk: boolean;
  perkTitle: string; perkDescription: string; perkRedemption: string; perkConditions: string; perkExpiresOn: string;
};
export type ImageRegistration = {
  versionId: string; storagePath: string; filename: string; mimeType: string;
  byteSize: number; width: number; height: number; displayPublicly: boolean; altText: string;
};

function isOptionalWebUrl(value: string) {
  if (!value.trim()) return true;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

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

export async function saveContactDetails(input: ContactDetails): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId)) return { ok: false, message: "This draft could not be identified." };
  if (!input.publicContactName.trim() || input.publicContactName.trim().length > 120) return { ok: false, message: "Enter the contact name to show on your listing." };
  if (input.publicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.publicEmail.trim())) return { ok: false, message: "Enter a valid email address." };
  if (input.publicPhone.trim().length > 40) return { ok: false, message: "Enter a telephone number using no more than 40 characters." };
  if (!isOptionalWebUrl(input.websiteUrl) || Object.values(input.socialLinks).some((value) => !isOptionalWebUrl(value))) return { ok: false, message: "Enter complete website and social links beginning with https://" };
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const socialLinks = Object.fromEntries(Object.entries(input.socialLinks).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
  const { data, error } = await supabase.from("listing_versions").update({
    public_contact_name: input.publicContactName.trim(), public_email: input.publicEmail.trim() || null,
    show_public_email: Boolean(input.publicEmail.trim()), public_phone: input.publicPhone.trim() || null,
    show_public_phone: Boolean(input.publicPhone.trim()), website_url: input.websiteUrl.trim() || null, social_links: socialLinks,
  }).eq("id", input.versionId).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "We couldn’t save your contact details. Please try again." };
  return { ok: true };
}

export async function saveAboutBusiness(input: AboutBusiness, requireComplete = false): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId)) return { ok: false, message: "This draft could not be identified." };
  const shortSummary = input.shortSummary.trim(); const fullDescription = input.fullDescription.trim(); const founderStory = input.founderStory.trim();
  if (shortSummary.length > 160 || fullDescription.length > 2000 || founderStory.length > 2000) return { ok: false, message: "One or more fields is too long." };
  if (requireComplete && !shortSummary) return { ok: false, message: "Add a short summary before continuing." };
  if (requireComplete && fullDescription.length < 100) return { ok: false, message: "Please write at least 100 characters in your full business description before continuing." };
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { data, error } = await supabase.from("listing_versions").update({ short_summary: shortSummary, full_description: fullDescription, founder_story: founderStory || null }).eq("id", input.versionId).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "We couldn’t save your business description. Please try again." };
  return { ok: true };
}

export async function saveHowYouWork(input: HowYouWork, requireComplete = false): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId)) return { ok: false, message: "This draft could not be identified." };
  if (requireComplete && !input.isUkBased) return { ok: false, message: "Confirm that this business is based in the UK before continuing." };
  if (requireComplete && !input.offersOnline && !input.offersInPerson) return { ok: false, message: "Choose at least one way that you work with customers." };
  if (requireComplete && input.offersInPerson && !input.inPersonMode) return { ok: false, message: "Choose whether you travel to customers, customers visit you, or both." };
  if (input.offersInPerson && !isCoverageMiles(Number(input.travelRadiusMiles))) return { ok: false, message: "Choose a valid travel distance." };
  const postcode = input.offersInPerson && input.businessPostcode.trim() ? await lookupUkPostcode(input.businessPostcode) : null;
  if (requireComplete && input.offersInPerson && !postcode) return { ok: false, message: "Enter a complete, valid UK postcode. It will be kept private." };
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { data, error } = await supabase.from("listing_versions").update({
    is_uk_based: input.isUkBased, show_base_location: input.offersInPerson,
    offers_online: input.offersOnline, offers_in_person: input.offersInPerson,
    serves_local: input.offersInPerson, serves_uk_wide: input.offersOnline || input.inPersonNationwide,
    base_town_city: postcode?.publicArea ?? null, uk_region: postcode?.publicRegion ?? null,
    business_postcode: postcode?.postcode ?? (input.offersInPerson ? input.businessPostcode.trim().toUpperCase() || null : null), postcode_latitude: postcode?.latitude ?? null,
    postcode_longitude: postcode?.longitude ?? null, in_person_mode: input.offersInPerson ? input.inPersonMode : null,
    travel_radius_miles: input.offersInPerson && input.inPersonMode !== "customers_visit" ? Number(input.travelRadiusMiles) : null,
    in_person_nationwide: input.offersInPerson && input.inPersonMode !== "customers_visit" && input.inPersonNationwide,
  }).eq("id", input.versionId).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "We couldn’t save how and where you work. Please try again." };
  return { ok: true };
}

export async function registerListingImage(input: ImageRegistration): Promise<SaveResult & { oldPath?: string | null }> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId) || input.byteSize < 1 || input.byteSize > 5_242_880 || !["image/jpeg", "image/png", "image/webp"].includes(input.mimeType)) return { ok: false, message: "Choose a JPG, PNG or WebP image no larger than 5MB." };
  if (input.filename.length > 255 || input.altText.length > 300 || input.width < 1 || input.height < 1) return { ok: false, message: "This image could not be registered." };
  const supabase = await createClient(); const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { data, error } = await supabase.rpc("register_listing_image", {
    target_version_id: input.versionId, storage_path: input.storagePath, filename: input.filename,
    file_mime_type: input.mimeType, file_byte_size: input.byteSize, image_width: input.width,
    image_height: input.height, show_publicly: input.displayPublicly, image_alt_text: input.altText,
  });
  if (error) return { ok: false, message: "We couldn’t save your image. Please try again." };
  return { ok: true, oldPath: data };
}

export async function removeListingImage(versionId: string): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(versionId)) return { ok: false, message: "This draft could not be identified." };
  const supabase = await createClient(); const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { data: image, error: readError } = await supabase.from("listing_images").select("private_storage_path").eq("listing_version_id", versionId).maybeSingle();
  if (readError) return { ok: false, message: "We couldn’t remove your image. Please try again." };
  if (!image) return { ok: true };
  const { error: deleteError } = await supabase.from("listing_images").delete().eq("listing_version_id", versionId);
  if (deleteError) return { ok: false, message: "We couldn’t remove your image. Please try again." };
  await supabase.storage.from("listing-images-private").remove([image.private_storage_path]);
  return { ok: true };
}

export async function saveStandOutDetails(input: StandOutDetails, requireComplete = false): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId)) return { ok: false, message: "This draft could not be identified." };
  const perkTitle = input.perkTitle.trim(), perkDescription = input.perkDescription.trim(), perkRedemption = input.perkRedemption.trim(), perkConditions = input.perkConditions.trim();
  if (input.imageAltText.length > 300 || perkTitle.length > 160 || [perkDescription, perkRedemption, perkConditions].some((value) => value.length > 1000)) return { ok: false, message: "One or more fields is too long." };
  if (input.hasPlazaPerk && requireComplete && (!perkTitle || !perkDescription || !perkRedemption)) return { ok: false, message: "Complete the Plaza Perk title, description and redemption instructions before continuing." };
  const supabase = await createClient(); const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const perkValues = input.hasPlazaPerk ? { perk_title: perkTitle, perk_description: perkDescription, perk_redemption: perkRedemption, perk_conditions: perkConditions || null, perk_expires_on: input.perkExpiresOn || null } : { perk_title: null, perk_description: null, perk_redemption: null, perk_conditions: null, perk_expires_on: null };
  const { data, error } = await supabase.from("listing_versions").update({ has_plaza_perk: input.hasPlazaPerk, ...perkValues }).eq("id", input.versionId).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "We couldn’t save this section. Please try again." };
  const { error: imageError } = await supabase.from("listing_images").update({ display_publicly: true, alt_text: input.imageAltText.trim() || null }).eq("listing_version_id", input.versionId);
  if (imageError) return { ok: false, message: "We couldn’t save your image preferences. Please try again." };
  return { ok: true };
}

export async function submitApplication(versionId: string, declarationAccepted: boolean): Promise<SaveResult> {
  if (!/^[0-9a-f-]{36}$/i.test(versionId)) return { ok: false, message: "This draft could not be identified." };
  if (!declarationAccepted) return { ok: false, message: "Confirm the declaration before submitting." };
  const supabase = await createClient(); const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) return { ok: false, message: "Your session has expired. Please sign in again." };
  const { data: draft } = await supabase.from("listing_versions").select("supersedes_version_id").eq("id", versionId).eq("status", "draft").maybeSingle();
  const { error } = await supabase.rpc("submit_application", { target_version_id: versionId });
  if (error) return { ok: false, message: "Your application isn’t ready to submit yet. Review the incomplete sections above and try again." };
  await sendApplicationNotification(supabase, versionId, draft?.supersedes_version_id ? "resubmission_received" : "submission_received");
  return { ok: true };
}
