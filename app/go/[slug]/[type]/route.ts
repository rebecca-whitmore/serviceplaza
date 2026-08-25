import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const contactTypes = new Set(["email", "phone", "instagram", "facebook", "linkedin", "tiktok", "youtube"]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string; type: string }> }) {
  const { slug, type } = await params;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && contactTypes.has(type)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("record_listing_outbound_click", { target_slug: slug, target_link_type: type });
    if (data && (/^https?:\/\//.test(data) || /^mailto:/.test(data) || /^tel:/.test(data))) {
      return NextResponse.redirect(data, 307);
    }
  }
  return NextResponse.redirect(new URL(`/business/${encodeURIComponent(slug)}?contact=unavailable`, request.url), 303);
}
