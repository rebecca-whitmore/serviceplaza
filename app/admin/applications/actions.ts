"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { sendApplicationNotification, type ApplicationNotificationType } from "@/lib/email/application-notifications";

export type AdminDecision = "approve" | "request_changes" | "decline";
export type DecisionResult = { ok: true } | { ok: false; message: string };

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
