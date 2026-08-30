import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/admin",
        "/api",
        "/auth",
        "/go",
        "/home-preview",
        "/login",
      ],
    },
    sitemap: "https://serviceplaza.co.uk/sitemap.xml",
    host: "https://serviceplaza.co.uk",
  };
}
