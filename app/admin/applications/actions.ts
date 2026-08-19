"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { sendApplicationNotification, type ApplicationNotificationType } from "@/lib/email/application-notifications";

export type AdminDecision = "approve" | "request_changes" | "decline";
export type DecisionResult = { ok: true } | { ok: false; message: string };

export async function updatePendingApplicationImage(formData: FormData) {
  const versionId = String(formData.get("versionId") ?? ""); const altText = String(formData.get("altText") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(versionId) || altText.length > 300) redirect(`/admin/applications/${versionId}/edit?error=image`);
  const candidate = formData.get("image"); const file = candidate instanceof File && candidate.size ? candidate : null;
  if (file && (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5_242_880)) redirect(`/admin/applications/${versionId}/edit?error=image`);
  const { supabase, userId } = await requireAdmin(); let newPath: string | null = null;
  if (file) {
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    newPath = `${userId}/${versionId}/admin-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("listing-images-private").upload(newPath, file, { contentType: file.type, upsert: false });
    if (error) redirect(`/admin/applications/${versionId}/edit?error=image`);
  }
  const { data: oldPath, error } = await supabase.rpc("admin_update_pending_application_image", {
    target_version_id: versionId, storage_path: newPath, filename: file?.name ?? null,
    file_mime_type: file?.type ?? null, file_byte_size: file?.size ?? null, image_alt_text: altText,
  });
  if (error) { if (newPath) await supabase.storage.from("listing-images-private").remove([newPath]); redirect(`/admin/applications/${versionId}/edit?error=image`); }
  if (newPath && oldPath && oldPath !== newPath) await supabase.storage.from("listing-images-private").remove([oldPath]);
  revalidatePath(`/admin/applications/${versionId}`); revalidatePath(`/admin/applications/${versionId}/edit`);
  redirect(`/admin/applications/${versionId}/edit?notice=image_saved`);
}

export async function removePendingApplicationImage(formData: FormData) {
  const versionId = String(formData.get("versionId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(versionId)) redirect("/admin");
  const { supabase } = await requireAdmin();
  const { data: oldPath, error } = await supabase.rpc("admin_remove_pending_application_image", { target_version_id: versionId });
  if (error) redirect(`/admin/applications/${versionId}/edit?error=image`);
  if (oldPath) await supabase.storage.from("listing-images-private").remove([oldPath]);
  revalidatePath(`/admin/applications/${versionId}`); revalidatePath(`/admin/applications/${versionId}/edit`);
  redirect(`/admin/applications/${versionId}/edit?notice=image_removed`);
}

export async function editPendingApplication(formData: FormData) {
  const versionId = String(formData.get("versionId") ?? "");
  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const checked = (name: string) => formData.get(name) === "on";
  if (!/^[0-9a-f-]{36}$/i.test(versionId)) redirect("/admin?error=edit");
  const services = value("customServices").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const reason = value("reason");
  const payload = {
    businessName: value("businessName"), shortSummary: value("shortSummary"), fullDescription: value("fullDescription"), founderStory: value("founderStory"),
    publicContactName: value("publicContactName"), publicEmail: value("publicEmail"), showPublicEmail: checked("showPublicEmail"),
    publicPhone: value("publicPhone"), showPublicPhone: checked("showPublicPhone"), websiteUrl: value("websiteUrl"),
    socialLinks: Object.fromEntries(["instagram", "facebook", "linkedin", "tiktok", "youtube"].map((name) => [name, value(name)]).filter(([, url]) => url)),
    isUkBased: checked("isUkBased"), offersOnline: checked("offersOnline"), offersInPerson: checked("offersInPerson"),
    baseTownCity: value("baseTownCity"), ukRegion: value("ukRegion"), hasPlazaPerk: checked("hasPlazaPerk"),
    perkTitle: value("perkTitle"), perkDescription: value("perkDescription"), perkRedemption: value("perkRedemption"), perkConditions: value("perkConditions"), perkExpiresOn: value("perkExpiresOn"),
  };
  if (!payload.businessName || !payload.shortSummary || payload.fullDescription.length < 100 || payload.founderStory.length > 2000 || !payload.publicContactName || !reason || !payload.isUkBased
    || (!payload.offersOnline && !payload.offersInPerson) || (payload.offersInPerson && !payload.baseTownCity && !payload.ukRegion)
    || (payload.showPublicEmail && !payload.publicEmail) || (payload.showPublicPhone && !payload.publicPhone)
    || (payload.hasPlazaPerk && (!payload.perkTitle || !payload.perkDescription || !payload.perkRedemption))) redirect(`/admin/applications/${versionId}/edit?error=incomplete`);
  if (services.length > 15 || services.some((service) => service.length > 80) || reason.length > 2000) redirect(`/admin/applications/${versionId}/edit?error=limits`);
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_edit_pending_application", { target_version_id: versionId, edit_payload: payload, custom_service_names: services, edit_reason: reason });
  if (error) redirect(`/admin/applications/${versionId}/edit?error=save`);
  const { error: founderError } = await supabase.from("listing_versions").update({ founder_story: payload.founderStory || null }).eq("id", versionId).eq("status", "pending");
  if (founderError) redirect(`/admin/applications/${versionId}/edit?error=save`);
  revalidatePath("/admin"); revalidatePath(`/admin/applications/${versionId}`);
  redirect(`/admin/applications/${versionId}?notice=edited`);
}

export async function decideApplication(input: { versionId: string; decision: AdminDecision; applicantMessage: string; privateNote: string }): Promise<DecisionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(input.versionId)) return { ok: false, message: "This application could not be identified." };
  const applicantMessage = input.applicantMessage.trim(); const privateNote = input.privateNote.trim();
  if ((input.decision === "request_changes" || input.decision === "decline") && !applicantMessage) return { ok: false, message: "Add a message for the applicant before continuing." };
  if (applicantMessage.length > 2000 || privateNote.length > 4000) return { ok: false, message: "One or more review notes is too long." };
  const { supabase } = await requireAdmin(); let publicImagePath: string | null = null;

  if (input.decision === "approve") {
    const { data: version } = await supabase.from("listing_versions").select("listing_id").eq("id", input.versionId).eq("status", "pending").maybeSingle();
    if (!version) return { ok: false, message: "This application is no longer awaiting a decision." };
    const { data: image } = await supabase.from("listing_images").select("private_storage_path, mime_type").eq("listing_version_id", input.versionId).maybeSingle();
    if (image) {
      const { data: file, error: downloadError } = await supabase.storage.from("listing-images-private").download(image.private_storage_path);
      if (downloadError || !file) return { ok: false, message: "The private listing image could not be prepared for publication." };
      const extension = image.mime_type === "image/png" ? "png" : image.mime_type === "image/webp" ? "webp" : "jpg";
      publicImagePath = `${version.listing_id}/${input.versionId}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("listing-images-public").upload(publicImagePath, file, { contentType: image.mime_type, upsert: true });
      if (uploadError) return { ok: false, message: "The listing image could not be published. No decision was recorded." };
    }
  }

  const { error } = await supabase.rpc("admin_decide_application", {
    target_version_id: input.versionId, decision: input.decision,
    message_to_applicant: applicantMessage, administrator_note: privateNote,
    approved_public_image_path: publicImagePath,
  });
  if (error) {
    if (publicImagePath) await supabase.storage.from("listing-images-public").remove([publicImagePath]);
    return { ok: false, message: "The decision could not be recorded. The application remains pending." };
  }
  const notificationType: Record<AdminDecision, ApplicationNotificationType> = {
    approve: "approved", request_changes: "changes_requested", decline: "declined",
  };
  await sendApplicationNotification(supabase, input.versionId, notificationType[input.decision]);
  revalidatePath("/admin"); revalidatePath(`/admin/applications/${input.versionId}`); revalidatePath("/account");
  return { ok: true };
}

export async function retryApplicationNotification(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(notificationId)) return;
  const { supabase } = await requireAdmin();
  const { data: notification } = await supabase.from("application_email_notifications")
    .select("listing_version_id, notification_type").eq("id", notificationId).eq("status", "failed").maybeSingle();
  const allowed: ApplicationNotificationType[] = ["submission_received", "resubmission_received", "changes_requested", "approved", "declined"];
  if (!notification || !allowed.includes(notification.notification_type as ApplicationNotificationType)) return;
  await sendApplicationNotification(supabase, notification.listing_version_id, notification.notification_type as ApplicationNotificationType);
  revalidatePath("/admin");
}
