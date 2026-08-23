import type { MetadataRoute } from "next";
import { loadPublicDirectory } from "@/lib/public-directory";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.SERVICE_PLAZA_URL || "https://serviceplaza.co.uk").replace(/\/$/, "");
  const { listings, categories } = await loadPublicDirectory();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: baseUrl + "/businesses", changeFrequency: "daily", priority: 0.9 },
    { url: baseUrl + "/find-a-service", changeFrequency: "monthly", priority: 0.8 },
    { url: baseUrl + "/about", changeFrequency: "monthly", priority: 0.6 },
    { url: baseUrl + "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
    { url: baseUrl + "/cookie-policy", changeFrequency: "yearly", priority: 0.3 },
    { url: baseUrl + "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: baseUrl + "/businesses/" + encodeURIComponent(category.slug),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const listingPages: MetadataRoute.Sitemap = listings
    .filter((listing) => Boolean(listing.slug))
    .map((listing) => ({
      url: baseUrl + "/business/" + encodeURIComponent(listing.slug!),
      lastModified: listing.published_at || listing.first_published_at || undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [...staticPages, ...categoryPages, ...listingPages];
}
