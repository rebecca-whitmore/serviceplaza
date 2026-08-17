"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function startApplication(formData: FormData) {
  const contactName = formData.get("contactName");

  if (typeof contactName !== "string" || !contactName.trim()) {
    redirect("/account?error=contact_name");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("start_application", {
    contact_name: contactName.trim(),
  });

  if (error) {
    redirect("/account?error=start_application");
  }

  revalidatePath("/account");
  redirect("/account/application/basic-information");
}

export async function startListingEdit() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) redirect("/login");
  const { data, error } = await supabase.rpc("start_listing_edit");
  const edit = data?.[0];
  if (error || !edit) redirect("/account?error=start_listing_edit");

  if (edit.created_new) {
    const [{ data: sourceImage }, { data: sourceVersion }] = await Promise.all([
      supabase.from("listing_images").select("private_storage_path, original_filename, mime_type, byte_size, width, height, display_publicly, alt_text").eq("listing_version_id", edit.source_version_id).maybeSingle(),
      supabase.from("listing_versions").select("published_image_path").eq("id", edit.source_version_id).maybeSingle(),
    ]);
    const sourcePath = sourceImage?.private_storage_path ?? sourceVersion?.published_image_path;
    const sourceBucket = sourceImage ? "listing-images-private" : "listing-images-public";
    if (sourcePath) {
      const { data: imageFile } = await supabase.storage.from(sourceBucket).download(sourcePath);
      if (imageFile) {
        const mimeType = sourceImage?.mime_type ?? (imageFile.type === "image/png" || imageFile.type === "image/webp" ? imageFile.type : "image/jpeg");
        const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
        const newPath = `${auth.claims.sub}/${edit.listing_version_id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("listing-images-private").upload(newPath, imageFile, { contentType: mimeType, upsert: false });
        if (!uploadError) {
          const { error: imageError } = await supabase.from("listing_images").insert({ listing_version_id: edit.listing_version_id, private_storage_path: newPath, original_filename: sourceImage?.original_filename ?? `listing-image.${extension}`, mime_type: mimeType, byte_size: sourceImage?.byte_size ?? imageFile.size, width: sourceImage?.width ?? null, height: sourceImage?.height ?? null, display_publicly: sourceImage?.display_publicly ?? true, alt_text: sourceImage?.alt_text ?? null });
          if (imageError) await supabase.storage.from("listing-images-private").remove([newPath]);
        }
      }
    }
  }
  revalidatePath("/account");
  redirect("/account/application/basic-information");
}
