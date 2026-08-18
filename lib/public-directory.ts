import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PublicListing = Database["public"]["Views"]["published_listing_details"]["Row"];
export type DirectoryCategory = { name: string; slug: string; description: string | null; sort_order: number };
export type DirectoryListing = PublicListing & {
  primaryCategory: { name: string; slug: string } | null;
  additionalCategories: Array<{ name: string; slug: string }>;
  serviceTags: string[];
  services: string[];
  imageUrl: string | null;
};

type TaxonomyItem = { name: string; slug?: string };
function item(value: unknown): TaxonomyItem | null { return value && typeof value === "object" && typeof (value as TaxonomyItem).name === "string" ? value as TaxonomyItem : null; }
function items(value: unknown): TaxonomyItem[] { return Array.isArray(value) ? value.filter((entry): entry is TaxonomyItem => Boolean(item(entry))) : []; }

export async function loadPublicDirectory() {
  const supabase = await createClient();
  const [{ data: listingRows }, { data: categoryRows }] = await Promise.all([
    supabase.rpc("get_published_listing_details", { target_slug: null }),
    supabase.from("categories").select("name, slug, description, sort_order").eq("is_active", true).order("sort_order"),
  ]);
  const listings: DirectoryListing[] = await Promise.all((listingRows ?? []).filter((listing) => listing.version_id && listing.slug).map(async (listing) => {
    const { data } = await supabase.rpc("get_public_listing_taxonomy", { target_version_id: listing.version_id! });
    const taxonomy = data?.[0]; const primary = item(taxonomy?.primary_category);
    return {
      ...listing,
      primaryCategory: primary?.slug ? { name: primary.name, slug: primary.slug } : null,
      additionalCategories: items(taxonomy?.additional_categories).filter((entry) => entry.slug).map((entry) => ({ name: entry.name, slug: entry.slug! })),
      serviceTags: items(taxonomy?.service_tags).map((entry) => entry.name), services: items(taxonomy?.services).map((entry) => entry.name),
      imageUrl: listing.published_image_path ? supabase.storage.from("listing-images-public").getPublicUrl(listing.published_image_path).data.publicUrl : null,
    };
  }));
  return { listings, categories: (categoryRows ?? []) as DirectoryCategory[] };
}
