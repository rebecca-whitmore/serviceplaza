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
