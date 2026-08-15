import { createClient } from "@/lib/supabase/server";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
};

export async function getActiveCategories(): Promise<PublicCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw new Error("Unable to load Service Plaza categories.", {
      cause: error,
    });
  }

  return data;
}
