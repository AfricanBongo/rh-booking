import { strapiGet } from "@/lib/strapi";

export interface MerchItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  merch_status: "open" | "closed";
  conferenceId: string;
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  conferenceId: string;
}

interface StrapiMerchItem {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  images: { url: string }[] | null;
  merch_status: "open" | "closed";
  conferences: { documentId: string }[] | null;
}

interface StrapiPickupLocation {
  id: number;
  documentId: string;
  name: string;
  address: string;
  conferences: { documentId: string }[] | null;
}

function resolveImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${url}`;
}

function mapMerchItem(item: StrapiMerchItem, conferenceId: string): MerchItem {
  return {
    id: item.documentId,
    slug: item.slug,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: resolveImageUrl(item.images?.[0]?.url),
    merch_status: item.merch_status,
    conferenceId,
  };
}

function mapPickupLocation(item: StrapiPickupLocation, conferenceId: string): PickupLocation {
  return {
    id: item.documentId,
    name: item.name,
    address: item.address,
    conferenceId,
  };
}

export async function getMerchItems(conferenceId: string): Promise<MerchItem[]> {
  try {
    const result = await strapiGet<StrapiMerchItem[]>("/api/merch-items", {
      "filters[conferences][documentId][$eq]": conferenceId,
      "populate": "images",
    });
    return result.data.map((item) => mapMerchItem(item, conferenceId));
  } catch {
    return [];
  }
}

export async function getMerchItem(id: string): Promise<MerchItem> {
  const result = await strapiGet<StrapiMerchItem>(`/api/merch-items/${id}`, {
    populate: "images",
  });
  return mapMerchItem(result.data, result.data.conferences?.[0]?.documentId ?? "");
}

export async function getMerchItemBySlug(slug: string): Promise<MerchItem> {
  const result = await strapiGet<StrapiMerchItem[]>("/api/merch-items", {
    "filters[slug][$eq]": slug,
    "populate": "images,conferences",
  });
  if (!result.data[0]) {
    throw { status: 404, name: "NotFound", message: "Merch item not found" };
  }
  return mapMerchItem(result.data[0], result.data[0].conferences?.[0]?.documentId ?? "");
}

export async function getPickupLocations(conferenceId: string): Promise<PickupLocation[]> {
  try {
    const result = await strapiGet<StrapiPickupLocation[]>("/api/pickup-locations", {
      "filters[conferences][documentId][$eq]": conferenceId,
    });
    return result.data.map((item) => mapPickupLocation(item, conferenceId));
  } catch {
    return [];
  }
}
