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
  redirect("/account/application");
}
