import { ApplicationShell } from "./application-shell";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  return <ApplicationShell>{children}</ApplicationShell>;
}
