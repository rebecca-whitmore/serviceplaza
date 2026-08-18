import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DirectoryView } from "../directory-view";

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params; const supabase = await createClient(); const { data } = await supabase.from("categories").select("name, description").eq("slug", categorySlug).eq("is_active", true).maybeSingle();
  return data ? { title: `${data.name} | Service Plaza`, description: data.description ?? `Browse UK-based ${data.name.toLowerCase()} businesses.`, alternates: { canonical: `/businesses/${categorySlug}` } } : { title: "Business category | Service Plaza" };
}
export default async function CategoryDirectoryPage({ params, searchParams }: { params: Promise<{ categorySlug: string }>; searchParams: Promise<Record<string, string | undefined>> }) { const { categorySlug } = await params; return <DirectoryView categorySlug={categorySlug} query={await searchParams}/>; }
