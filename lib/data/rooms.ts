import { strapiGet } from "@/lib/strapi";

export interface RoomType {
  id: string;
  documentId: string;
  type: "private" | "shared-2" | "shared-4";
  price: number;
  totalAvailable: number;
  description: string;
  imageUrl: string | null;
  conferenceId: string;
}

interface StrapiRoomTypeItem {
  id: number;
  documentId: string;
  type: "private" | "shared-2" | "shared-4";
  price: number;
  total_available: number;
  description: string;
  images: { url: string }[] | null;
  conferences: { documentId: string }[] | null;
}

function resolveImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${url}`;
}

function mapRoomType(item: StrapiRoomTypeItem, conferenceId: string): RoomType {
  return {
    id: item.documentId,
    documentId: item.documentId,
    type: item.type,
    price: item.price,
    totalAvailable: item.total_available,
    description: item.description,
    imageUrl: resolveImageUrl(item.images?.[0]?.url),
    conferenceId,
  };
}

export async function getRoomTypes(conferenceId: string): Promise<RoomType[]> {
  try {
    const result = await strapiGet<StrapiRoomTypeItem[]>("/api/room-types", {
      "filters[conferences][documentId][$eq]": conferenceId,
      "populate": "images",
    });
    return result.data.map((item) => mapRoomType(item, conferenceId));
  } catch {
    return [];
  }
}
