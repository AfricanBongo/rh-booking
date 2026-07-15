import { strapiGet } from "@/lib/strapi";

export interface Conference {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  paymentDeadline: string;
  location: string;
  isActive: boolean;
  imageUrl: string | null;
}

interface StrapiConferenceItem {
  id: number;
  documentId: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  payment_deadline: string;
  location: string;
  is_active: boolean;
  image: { url: string; formats: Record<string, unknown> } | null;
}

function resolveImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${url}`;
}

function mapConference(item: StrapiConferenceItem): Conference {
  return {
    id: item.documentId,
    name: item.name,
    description: item.description,
    startDate: item.start_date,
    endDate: item.end_date,
    paymentDeadline: item.payment_deadline,
    location: item.location,
    isActive: item.is_active,
    imageUrl: resolveImageUrl(item.image?.url),
  };
}

export async function getConferences(): Promise<Conference[]> {
  try {
    const result = await strapiGet<StrapiConferenceItem[]>("/api/conferences", {
      "filters[is_active][$eq]": "true",
      "sort": "start_date:asc",
      "populate": "image",
    });
    return result.data.map(mapConference);
  } catch {
    return [];
  }
}

export async function getConference(id: string): Promise<Conference> {
  const result = await strapiGet<StrapiConferenceItem>(
    `/api/conferences/${id}`,
    { populate: "image" }
  );
  return mapConference(result.data);
}
