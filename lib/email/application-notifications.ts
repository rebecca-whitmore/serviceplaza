import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ApplicationNotificationType =
  | "submission_received"
  | "resubmission_received"
  | "changes_requested"
  | "approved"
  | "declined";

const content: Record<ApplicationNotificationType, { subject: string; intro: string; action: string }> = {
  submission_received: { subject: "We have received your Service Plaza application", intro: "Thank you for submitting your business listing. It is now awaiting review.", action: "View your application" },
  resubmission_received: { subject: "We have received your updated Service Plaza application", intro: "Thank you for updating and resubmitting your business listing. It is now awaiting review.", action: "View your application" },
  changes_requested: { subject: "Your Service Plaza application needs an update", intro: "We have reviewed your application and left a message for you. Sign in to view the message and update your listing.", action: "Sign in and view the message" },
  approved: { subject: "Your Service Plaza application has been approved", intro: "Your business listing application has been approved and is now live on Service Plaza.", action: "View your listing" },
  declined: { subject: "An update about your Service Plaza application", intro: "We have completed our review of your business listing application. Sign in to view the outcome and our message.", action: "Sign in and view the update" },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function sendApplicationNotification(
  supabase: SupabaseClient<Database>, versionId: string, notificationType: ApplicationNotificationType,
) {
  const { data, error } = await supabase.rpc("queue_application_notification", { target_version_id: versionId, notification_kind: notificationType });
  const notification = data?.[0];
  if (error || !notification) return false;
  if (notification.delivery_status === "sent") return true;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const siteUrl = (process.env.SERVICE_PLAZA_URL || "https://serviceplaza.co.uk").replace(/\/$/, "");
  const complete = async (succeeded: boolean, messageId: string | null, deliveryError: string | null) => {
    await supabase.rpc("complete_application_notification", {
      target_notification_id: notification.notification_id, delivery_succeeded: succeeded,
      resend_message_id: messageId ?? "", delivery_error: deliveryError ?? "",
    });
  };

  if (!apiKey || !from) {
    await complete(false, null, "Transactional email environment variables are not configured.");
    return false;
  }

  const template = content[notificationType];
  const businessName = notification.business_name?.trim() || "your business";
  const accountUrl = `${siteUrl}/account`;
  let actionUrl = notificationType === "approved" ? `${siteUrl}/businesses` : accountUrl;
  if (notificationType === "approved") {
    const { data: version } = await supabase.from("listing_versions").select("listing_id").eq("id", versionId).maybeSingle();
    if (version?.listing_id) {
      const { data: listing } = await supabase.from("listings").select("slug").eq("id", version.listing_id).maybeSingle();
      if (listing?.slug) actionUrl = `${siteUrl}/business/${listing.slug}`;
    }
  }
  const html = `<!doctype html><html><body style="margin:0;background:#f7f5f0;color:#272622;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border:1px solid #ded9cf;border-radius:16px;padding:32px"><p style="margin:0 0 20px;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Service Plaza</p><h1 style="margin:0 0 16px;font-size:26px;line-height:1.25">${escapeHtml(template.subject)}</h1><p style="margin:0 0 12px;line-height:1.6">Hello,</p><p style="margin:0 0 24px;line-height:1.6">${escapeHtml(template.intro)}</p><p style="margin:0 0 28px;line-height:1.6"><strong>Business:</strong> ${escapeHtml(businessName)}</p><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#26372d;color:#fff;text-decoration:none;border-radius:999px;padding:13px 22px;font-weight:700">${escapeHtml(template.action)}</a><p style="margin:28px 0 0;color:#666;font-size:13px;line-height:1.5">If the button does not work, visit ${escapeHtml(actionUrl)}</p></div></div></body></html>`;
  const text = `Service Plaza\n\n${template.intro}\n\nBusiness: ${businessName}\n\n${template.action}: ${actionUrl}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [notification.recipient_email], subject: template.subject, html, text }),
    });
    const result = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!response.ok || !result.id) {
      await complete(false, null, result.message || result.name || `Email provider returned ${response.status}.`);
      return false;
    }
    await complete(true, result.id, null);
    return true;
  } catch {
    await complete(false, null, "The email provider could not be reached.");
    return false;
  }
}
