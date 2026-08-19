"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";

export async function updatePublishedListingImage(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? ""); const altText = String(formData.get("altText") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(listingId) || altText.length > 300) redirect(`/admin/listings/${listingId}?error=image`);
  const candidate = formData.get("image"); const file = candidate instanceof File && candidate.size ? candidate : null;
  if (file && (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5_242_880)) redirect(`/admin/listings/${listingId}?error=image`);
  const { supabase, userId } = await requireAdmin();
  const { data: listing } = await supabase.from("listings").select("current_published_version_id").eq("id", listingId).maybeSingle();
  if (!listing?.current_published_version_id) redirect(`/admin/listings/${listingId}?error=image`);
  let privatePath: string | null = null; let publicPath: string | null = null;
  if (file) {
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"; const unique = crypto.randomUUID();
    privatePath = `${userId}/${listing.current_published_version_id}/admin-${unique}.${extension}`;
    publicPath = `${listingId}/${listing.current_published_version_id}-admin-${unique}.${extension}`;
    const { error: privateError } = await supabase.storage.from("listing-images-private").upload(privatePath, file, { contentType: file.type, upsert: false });
    if (privateError) redirect(`/admin/listings/${listingId}?error=image`);
    const { error: publicError } = await supabase.storage.from("listing-images-public").upload(publicPath, file, { contentType: file.type, upsert: false });
    if (publicError) { await supabase.storage.from("listing-images-private").remove([privatePath]); redirect(`/admin/listings/${listingId}?error=image`); }
  }
  const { data: oldPaths, error } = await supabase.rpc("admin_update_published_listing_image", {
    target_listing_id: listingId, new_private_storage_path: privatePath, new_public_storage_path: publicPath,
    filename: file?.name ?? null, file_mime_type: file?.type ?? null, file_byte_size: file?.size ?? null, image_alt_text: altText,
  });
  if (error) { if (privatePath) await supabase.storage.from("listing-images-private").remove([privatePath]); if (publicPath) await supabase.storage.from("listing-images-public").remove([publicPath]); redirect(`/admin/listings/${listingId}?error=image`); }
  const old = oldPaths && typeof oldPaths === "object" && !Array.isArray(oldPaths) ? oldPaths as { private_path?: string; public_path?: string } : {};
  if (file && old.private_path && old.private_path !== privatePath) await supabase.storage.from("listing-images-private").remove([old.private_path]);
  if (file && old.public_path && old.public_path !== publicPath) await supabase.storage.from("listing-images-public").remove([old.public_path]);
  revalidatePath(`/admin/listings/${listingId}`); revalidatePath(`/business`);
  redirect(`/admin/listings/${listingId}?notice=image_saved`);
}

export async function removePublishedListingImage(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? ""); if (!/^[0-9a-f-]{36}$/i.test(listingId)) redirect("/admin/listings");
  const { supabase } = await requireAdmin(); const { data: oldPaths, error } = await supabase.rpc("admin_remove_published_listing_image", { target_listing_id: listingId });
  if (error) redirect(`/admin/listings/${listingId}?error=image`);
  const old = oldPaths && typeof oldPaths === "object" && !Array.isArray(oldPaths) ? oldPaths as { private_path?: string; public_path?: string } : {};
  if (old.private_path) await supabase.storage.from("listing-images-private").remove([old.private_path]); if (old.public_path) await supabase.storage.from("listing-images-public").remove([old.public_path]);
  revalidatePath(`/admin/listings/${listingId}`); revalidatePath(`/business`);
  redirect(`/admin/listings/${listingId}?notice=image_removed`);
}

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

export async function setWebsiteOpportunity(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  const opportunity = formData.get("opportunity") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) redirect("/admin/listings");
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_website_opportunity", { target_listing_id: listingId, opportunity });
  if (error) redirect(`/admin/listings/${listingId}?error=internal_flag`);
  revalidatePath("/admin/listings"); revalidatePath(`/admin/listings/${listingId}`);
  redirect(`/admin/listings/${listingId}?notice=${opportunity ? "opportunity_added" : "opportunity_removed"}`);
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
  const imageCandidate = formData.get("image"); const imageFile = imageCandidate instanceof File && imageCandidate.size ? imageCandidate : null;
  const removeImage = checked("removeImage"); const imageAltText = value("imageAltText");
  const payload = {
    businessName: value("businessName"), shortSummary: value("shortSummary"), fullDescription: value("fullDescription"), founderStory: value("founderStory"),
    publicContactName: value("publicContactName"), publicEmail: value("publicEmail"), showPublicEmail: checked("showPublicEmail"),
    publicPhone: value("publicPhone"), showPublicPhone: checked("showPublicPhone"), websiteUrl: value("websiteUrl"),
    socialLinks: Object.fromEntries(["instagram", "facebook", "linkedin", "tiktok", "youtube"].map((name) => [name, value(name)]).filter(([, url]) => url)),
    offersOnline: checked("offersOnline"), offersInPerson: checked("offersInPerson"),
    servesLocal: checked("offersInPerson"), servesUkWide: checked("offersOnline"),
    baseTownCity: value("baseTownCity"), ukRegion: value("ukRegion"), hasPlazaPerk: checked("hasPlazaPerk"),
    perkTitle: value("perkTitle"), perkDescription: value("perkDescription"), perkRedemption: value("perkRedemption"), perkConditions: value("perkConditions"), perkExpiresOn: value("perkExpiresOn"),
  };
  const isUkBased = checked("isUkBased"); const showBaseLocation = payload.offersInPerson && Boolean(payload.baseTownCity || payload.ukRegion);
  if (!payload.businessName || !payload.shortSummary || payload.fullDescription.length < 100 || payload.founderStory.length > 2000 || !payload.publicContactName || !primaryCategoryId || !reason || !isUkBased
    || (!payload.offersOnline && !payload.offersInPerson)
    || (payload.offersInPerson && !payload.baseTownCity && !payload.ukRegion)
    || (payload.showPublicEmail && !payload.publicEmail) || (payload.showPublicPhone && !payload.publicPhone)
    || (payload.hasPlazaPerk && (!payload.perkTitle || !payload.perkDescription || !payload.perkRedemption))) redirect(`/admin/listings/${listingId}/edit?error=incomplete`);
  if (additionalCategoryIds.length > 2 || serviceTagIds.length > 8 || customServices.length > 15 || customServices.some((service) => service.length > 80) || reason.length > 2000) redirect(`/admin/listings/${listingId}/edit?error=limits`);
  if (imageAltText.length > 300 || (imageFile && (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type) || imageFile.size > 5_242_880))) redirect(`/admin/listings/${listingId}/edit?error=image`);
  const { supabase, userId } = await requireAdmin(); let privatePath: string | null = null; let publicPath: string | null = null;
  if (imageFile) {
    const extension = imageFile.type === "image/png" ? "png" : imageFile.type === "image/webp" ? "webp" : "jpg"; const unique = crypto.randomUUID();
    privatePath = `${userId}/admin-edits/${unique}.${extension}`; publicPath = `${listingId}/admin-${unique}.${extension}`;
    const { error: privateError } = await supabase.storage.from("listing-images-private").upload(privatePath, imageFile, { contentType: imageFile.type, upsert: false });
    if (privateError) redirect(`/admin/listings/${listingId}/edit?error=image`);
    const { error: publicError } = await supabase.storage.from("listing-images-public").upload(publicPath, imageFile, { contentType: imageFile.type, upsert: false });
    if (publicError) { await supabase.storage.from("listing-images-private").remove([privatePath]); redirect(`/admin/listings/${listingId}/edit?error=image`); }
  }
  const { data: newVersionId, error } = await supabase.rpc("admin_publish_listing_edit_with_uk", { target_listing_id: listingId, edit_payload: payload, primary_category_id: primaryCategoryId, additional_category_ids: additionalCategoryIds, selected_service_tag_ids: serviceTagIds, custom_service_names: customServices, edit_reason: reason, confirm_uk_based: isUkBased, display_base_location: showBaseLocation });
  if (error) { if (privatePath) await supabase.storage.from("listing-images-private").remove([privatePath]); if (publicPath) await supabase.storage.from("listing-images-public").remove([publicPath]); redirect(`/admin/listings/${listingId}/edit?error=save`); }
  if (newVersionId) await supabase.from("listing_versions").update({ founder_story: payload.founderStory || null }).eq("id", newVersionId);
  if (imageFile && privatePath && publicPath) {
    const { error: imageError } = await supabase.rpc("admin_update_published_listing_image", { target_listing_id: listingId, new_private_storage_path: privatePath, new_public_storage_path: publicPath, filename: imageFile.name, file_mime_type: imageFile.type, file_byte_size: imageFile.size, image_alt_text: imageAltText });
    if (imageError) { await supabase.storage.from("listing-images-private").remove([privatePath]); await supabase.storage.from("listing-images-public").remove([publicPath]); redirect(`/admin/listings/${listingId}?error=image`); }
  } else if (removeImage) {
    const { error: imageError } = await supabase.rpc("admin_remove_published_listing_image", { target_listing_id: listingId });
    if (imageError) redirect(`/admin/listings/${listingId}?error=image`);
  }
  revalidatePath("/admin/listings"); revalidatePath(`/admin/listings/${listingId}`); revalidatePath("/account");
  redirect(`/admin/listings/${listingId}?notice=edited`);
}
