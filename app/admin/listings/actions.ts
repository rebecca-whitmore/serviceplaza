"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";

export async function setListingVisibility(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  const makeVisible = formData.get("makeVisible") === "true";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(listingId) || (!makeVisible && !reason) || reason.length > 2000) {
    redirect(`/admin/listings/${listingId}?error=visibility`);
  }
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_listing_visibility", {
    target_listing_id: listingId, make_visible: makeVisible, administrator_reason: reason,
  });
  if (error) redirect(`/admin/listings/${listingId}?error=visibility`);
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${listingId}`);
  redirect(`/admin/listings/${listingId}?notice=${makeVisible ? "restored" : "hidden"}`);
}

export async function publishListingEdit(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const checked = (name: string) => formData.get(name) === "on";
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) redirect("/admin/listings?error=edit");
  const primaryCategoryId = value("primaryCategoryId");
  const additionalCategoryIds = formData.getAll("additionalCategoryIds").map(String).filter((id) => id !== primaryCategoryId);
  const serviceTagIds = formData.getAll("serviceTagIds").map(String);
  const customServices = value("customServices").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const reason = value("reason");
  const payload = {
    businessName: value("businessName"), shortSummary: value("shortSummary"), fullDescription: value("fullDescription"),
    publicContactName: value("publicContactName"), publicEmail: value("publicEmail"), showPublicEmail: checked("showPublicEmail"),
    publicPhone: value("publicPhone"), showPublicPhone: checked("showPublicPhone"), websiteUrl: value("websiteUrl"),
    socialLinks: Object.fromEntries(["instagram", "facebook", "linkedin", "tiktok", "youtube"].map((name) => [name, value(name)]).filter(([, url]) => url)),
    offersOnline: checked("offersOnline"), offersInPerson: checked("offersInPerson"), servesLocal: checked("servesLocal"), servesUkWide: checked("servesUkWide"),
    baseTownCity: value("baseTownCity"), ukRegion: value("ukRegion"), hasPlazaPerk: checked("hasPlazaPerk"),
    perkTitle: value("perkTitle"), perkDescription: value("perkDescription"), perkRedemption: value("perkRedemption"), perkConditions: value("perkConditions"), perkExpiresOn: value("perkExpiresOn"),
  };
  const isUkBased = checked("isUkBased"); const showBaseLocation = checked("showBaseLocation");
  if (!payload.businessName || !payload.shortSummary || payload.fullDescription.length < 100 || !payload.publicContactName || !primaryCategoryId || !reason || !isUkBased
    || (!payload.offersOnline && !payload.offersInPerson) || (!payload.servesLocal && !payload.servesUkWide)
    || (payload.servesLocal && (!payload.baseTownCity || !payload.ukRegion))
    || (payload.showPublicEmail && !payload.publicEmail) || (payload.showPublicPhone && !payload.publicPhone)
    || (payload.hasPlazaPerk && (!payload.perkTitle || !payload.perkDescription || !payload.perkRedemption))) redirect(`/admin/listings/${listingId}/edit?error=incomplete`);
  if (additionalCategoryIds.length > 2 || serviceTagIds.length > 8 || customServices.length > 15 || customServices.some((service) => service.length > 80) || reason.length > 2000) redirect(`/admin/listings/${listingId}/edit?error=limits`);
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_publish_listing_edit_with_uk", { target_listing_id: listingId, edit_payload: payload, primary_category_id: primaryCategoryId, additional_category_ids: additionalCategoryIds, selected_service_tag_ids: serviceTagIds, custom_service_names: customServices, edit_reason: reason, confirm_uk_based: isUkBased, display_base_location: showBaseLocation });
  if (error) redirect(`/admin/listings/${listingId}/edit?error=save`);
  revalidatePath("/admin/listings"); revalidatePath(`/admin/listings/${listingId}`); revalidatePath("/account");
  redirect(`/admin/listings/${listingId}?notice=edited`);
}
