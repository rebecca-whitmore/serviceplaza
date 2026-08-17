import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("record_listing_outbound_click", { target_slug: slug, target_link_type: "website" });
    if (data && /^https?:\/\//.test(data)) return NextResponse.redirect(data, 307);
  }
  return NextResponse.redirect(new URL(`/business/${encodeURIComponent(slug)}?website=unavailable`, request.url), 303);
}
