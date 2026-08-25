import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type EnquiryInput = {
  slug?: unknown; name?: unknown; email?: unknown; phone?: unknown;
  preferredContact?: unknown; message?: unknown; privacyAccepted?: unknown;
  website?: unknown; startedAt?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const preferences = new Set(["email", "telephone", "either"]);

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}
function error(message: string, status = 400) { return NextResponse.json({ ok: false, message }, { status }); }

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.nextUrl.host) return error("This request could not be verified.", 403);

  let body: EnquiryInput;
  try { body = await request.json() as EnquiryInput; } catch { return error("The enquiry could not be read."); }

  const slug = clean(body.slug).toLowerCase();
  const name = clean(body.name);
  const senderEmail = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const preferredContact = clean(body.preferredContact);
  const message = clean(body.message);
  const startedAt = Number(body.startedAt);

  // Bots commonly complete hidden fields or submit immediately after the form appears.
  if (clean(body.website)) return NextResponse.json({ ok: true });
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 3000 || Date.now() - startedAt > 7_200_000) return error("Please refresh the page and try again.");
  if (!slugPattern.test(slug)) return error("This business listing is unavailable.", 404);
  if (name.length < 2 || name.length > 120) return error("Enter your name (up to 120 characters).");
  if (!emailPattern.test(senderEmail) || senderEmail.length > 320) return error("Enter a valid email address.");
  if (phone.length > 40 || (phone && phone.length < 5)) return error("Enter a valid contact number, or leave it blank.");
  if (!preferences.has(preferredContact)) return error("Choose how you would prefer to be contacted.");
  if (preferredContact === "telephone" && !phone) return error("Add a contact number if you would prefer a telephone response.");
  if (message.length < 20 || message.length > 3000) return error("Your message must be between 20 and 3,000 characters.");
  if (body.privacyAccepted !== true) return error("Please confirm that you have read the Privacy Policy.");

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const hashSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hashSecret) return error("Enquiries are temporarily unavailable. Please try again later.", 503);
  const ipHash = createHmac("sha256", hashSecret).update(ip).digest("hex");

  const supabase = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ count: ipCount }, { count: emailCount }] = await Promise.all([
    supabase.from("listing_enquiries").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since),
    supabase.from("listing_enquiries").select("id", { count: "exact", head: true }).eq("sender_email", senderEmail).gte("created_at", since),
  ]);
  if ((ipCount ?? 0) >= 5 || (emailCount ?? 0) >= 3) return error("Too many enquiries have been sent recently. Please wait and try again.", 429);

  const { data: listing } = await supabase.from("listings")
    .select("id, business_id, current_published_version_id, publication_status")
    .eq("slug", slug).eq("publication_status", "published").maybeSingle();
  if (!listing?.current_published_version_id) return error("This business listing is unavailable.", 404);

  const [{ data: version }, { data: business }] = await Promise.all([
    supabase.from("listing_versions").select("id, business_name, status, is_uk_based").eq("id", listing.current_published_version_id).maybeSingle(),
    supabase.from("businesses").select("contact_email").eq("id", listing.business_id).maybeSingle(),
  ]);
  if (!version || version.status !== "approved" || !version.is_uk_based || !business?.contact_email) return error("This business listing is unavailable.", 404);

  const { data: enquiry, error: insertError } = await supabase.from("listing_enquiries").insert({
    listing_id: listing.id, listing_version_id: version.id, sender_name: name, sender_email: senderEmail,
    sender_phone: phone || null, preferred_contact: preferredContact, message,
    privacy_accepted_at: new Date().toISOString(), ip_hash: ipHash, delivery_email: business.contact_email,
  }).select("id").single();
  if (insertError || !enquiry) return error("We couldn’t save your enquiry. Please try again.", 500);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    await supabase.from("listing_enquiries").update({ delivery_status: "failed", delivery_error: "Transactional email environment variables are not configured." }).eq("id", enquiry.id);
    return error("Your enquiry was saved, but could not be delivered. Please try another contact option.", 503);
  }

  const contactPreference = preferredContact === "telephone" ? "Telephone" : preferredContact === "either" ? "Email or telephone" : "Email";
  const phoneLine = phone ? `<p style="margin:0 0 10px"><strong>Telephone:</strong> ${escapeHtml(phone)}</p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f7f7f3;color:#20272b;font-family:Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border:1px solid #d8d3ca;padding:32px"><p style="margin:0 0 18px;color:#85683e;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">New Service Plaza enquiry</p><h1 style="margin:0 0 22px;font-family:Georgia,serif;font-size:28px;font-weight:normal">Someone has contacted ${escapeHtml(version.business_name)}</h1><p style="margin:0 0 10px"><strong>Name:</strong> ${escapeHtml(name)}</p><p style="margin:0 0 10px"><strong>Email:</strong> ${escapeHtml(senderEmail)}</p>${phoneLine}<p style="margin:0 0 24px"><strong>Preferred contact:</strong> ${escapeHtml(contactPreference)}</p><div style="border-left:3px solid #b89760;background:#f4f2f6;padding:18px"><p style="margin:0;white-space:pre-wrap;line-height:1.6">${escapeHtml(message)}</p></div><p style="margin:24px 0 0;color:#60676a;font-size:13px;line-height:1.5">Reply directly to this email to respond to the enquirer. This enquiry was sent through your Service Plaza listing.</p></div></div></body></html>`;
  const text = `New Service Plaza enquiry for ${version.business_name}\n\nName: ${name}\nEmail: ${senderEmail}${phone ? `\nTelephone: ${phone}` : ""}\nPreferred contact: ${contactPreference}\n\n${message}\n\nReply directly to this email to respond to the enquirer.`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [business.contact_email], reply_to: senderEmail, subject: `New enquiry for ${version.business_name} via Service Plaza`, html, text }),
    });
    const result = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!response.ok || !result.id) {
      await supabase.from("listing_enquiries").update({ delivery_status: "failed", delivery_error: (result.message || result.name || `Email provider returned ${response.status}.`).slice(0, 1000) }).eq("id", enquiry.id);
      return error("Your enquiry was saved, but could not be delivered. Please try another contact option.", 503);
    }
    await supabase.from("listing_enquiries").update({ delivery_status: "sent", provider_message_id: result.id, delivery_error: null, sent_at: new Date().toISOString() }).eq("id", enquiry.id);
    return NextResponse.json({ ok: true });
  } catch {
    await supabase.from("listing_enquiries").update({ delivery_status: "failed", delivery_error: "The email provider could not be reached." }).eq("id", enquiry.id);
    return error("Your enquiry was saved, but could not be delivered. Please try another contact option.", 503);
  }
}
