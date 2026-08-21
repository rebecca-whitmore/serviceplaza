import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HowYouWorkForm } from "./how-you-work-form";
import styles from "../application.module.css";

export default async function HowYouWorkPage() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getClaims();
  if (error || !auth?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").eq("owner_user_id", auth.claims.sub).maybeSingle();
  if (!business) redirect("/account");
  const { data: listing } = await supabase.from("listings").select("id").eq("business_id", business.id).maybeSingle();
  if (!listing) redirect("/account");
  const { data: draft } = await supabase.from("listing_versions").select("id, is_uk_based, show_base_location, offers_online, offers_in_person, serves_local, serves_uk_wide, base_town_city, uk_region, business_postcode, in_person_mode, travel_radius_miles, in_person_nationwide").eq("listing_id", listing.id).eq("status", "draft").maybeSingle();
  if (!draft) redirect("/account");

  return <><header className={styles.header}><div><h1>How &amp; where you work</h1></div></header>
    <p className={styles.intro}>Help customers understand how your services are delivered and whether your business is available locally, across the UK or both.</p>
    <HowYouWorkForm versionId={draft.id} initialValues={{ isUkBased: draft.is_uk_based, showBaseLocation: draft.show_base_location, offersOnline: draft.offers_online, offersInPerson: draft.offers_in_person, servesLocal: draft.serves_local, servesUkWide: draft.serves_uk_wide, baseTownCity: draft.base_town_city ?? "", ukRegion: draft.uk_region ?? "", businessPostcode: draft.business_postcode ?? "", inPersonMode: (draft.in_person_mode as "travels_to_customer" | "customers_visit" | "both" | null) ?? "", travelRadiusMiles: draft.travel_radius_miles ?? 30, inPersonNationwide: draft.in_person_nationwide }} />
  </>;
}
