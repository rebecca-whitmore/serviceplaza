export type UkPostcode = {
  postcode: string;
  outcode: string;
  latitude: number;
  longitude: number;
  publicArea: string;
  publicRegion: string;
};

const POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export function normalisePostcode(value: string) {
  const compact = value.toUpperCase().replace(/\s+/g, "");
  return compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact;
}

export async function lookupUkPostcode(value: string): Promise<UkPostcode | null> {
  const postcode = normalisePostcode(value.trim());
  if (!POSTCODE_PATTERN.test(postcode)) return null;
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, { cache: "force-cache" });
    if (!response.ok) return null;
    const payload = await response.json() as { result?: { postcode?: string; outcode?: string; latitude?: number; longitude?: number; admin_district?: string | null; region?: string | null; country?: string | null } };
    const result = payload.result;
    if (!result || typeof result.latitude !== "number" || typeof result.longitude !== "number" || !result.outcode) return null;
    const publicArea = result.admin_district || result.region || result.country || "United Kingdom";
    const publicRegion = result.region && result.region !== publicArea ? result.region : "";
    return {
      postcode: normalisePostcode(result.postcode || postcode), outcode: result.outcode,
      latitude: result.latitude, longitude: result.longitude,
      publicArea, publicRegion,
    };
  } catch { return null; }
}

export const COVERAGE_MILES = [1,2,5,10,20,30,50,75,100,125,150] as const;
export const isCoverageMiles = (value: number): value is typeof COVERAGE_MILES[number] => COVERAGE_MILES.includes(value as typeof COVERAGE_MILES[number]);
