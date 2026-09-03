import { strapiGet } from "@/lib/strapi";

export interface Conference {
  id: string;
  slug: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  checkIn: string;
  checkOut: string;
  paymentDeadline: string;
  location: string;
  isActive: boolean;
  imageUrl: string | null;
  portraitImageUrl: string | null;
  otherImageUrls: string[];
}

interface StrapiConferenceItem {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  check_in: string;
  check_out: string;
  payment_deadline: string;
  location: string;
  is_active: boolean;
  image: { url: string; formats: Record<string, unknown> } | null;
  portrait_image: { url: string } | null;
  other_images: { url: string }[] | null;
}

function resolveImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${url}`;
}

function mapConference(item: StrapiConferenceItem): Conference {
  return {
    id: item.documentId,
    slug: item.slug,
    name: item.name,
    description: item.description,
    startDate: item.start_date,
    endDate: item.end_date,
    checkIn: item.check_in,
    checkOut: item.check_out,
    paymentDeadline: item.payment_deadline,
    location: item.location,
    isActive: item.is_active,
    imageUrl: resolveImageUrl(item.image?.url),
    portraitImageUrl: resolveImageUrl(item.portrait_image?.url),
    otherImageUrls: (item.other_images ?? [])
      .map((img) => resolveImageUrl(img.url))
      .filter((url): url is string => url !== null),
  };
}

export async function getConferences(): Promise<Conference[]> {
  try {
    const result = await strapiGet<StrapiConferenceItem[]>("/api/conferences", {
      "filters[is_active][$eq]": "true",
      "sort": "start_date:asc",
      "populate": "image,portrait_image,other_images",
    });
    return result.data.map(mapConference);
  } catch {
    return [];
  }
}

export async function getConference(id: string): Promise<Conference> {
  const result = await strapiGet<StrapiConferenceItem>(
    `/api/conferences/${id}`,
    { populate: "image,portrait_image,other_images" }
  );
  return mapConference(result.data);
}

export async function getConferenceBySlug(slug: string): Promise<Conference> {
  const result = await strapiGet<StrapiConferenceItem[]>("/api/conferences", {
    "filters[slug][$eq]": slug,
    "populate": "image,portrait_image,other_images",
  });
  if (!result.data[0]) {
    throw { status: 404, name: "NotFound", message: "Conference not found" };
  }
  return mapConference(result.data[0]);
}
