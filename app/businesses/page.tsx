import type { Metadata } from "next";
import { DirectoryView } from "./directory-view";

export const metadata: Metadata = { title: "Find UK Service Businesses | Service Plaza", description: "Search independent UK-based service businesses by service, category, location and how they work.", alternates: { canonical: "/businesses" } };
export default async function BusinessesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) { return <DirectoryView query={await searchParams}/>; }
