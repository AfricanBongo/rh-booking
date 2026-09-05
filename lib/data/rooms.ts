import { strapiGet } from "@/lib/strapi";
import { createClient } from "@/lib/supabase/server";
import { calculateRoomAvailability } from "@/lib/utils/price";
import type { ImageFormats } from "@/lib/data/conferences";

export interface RoomType {
  id: string;
  documentId: string;
  type: "private" | "shared-2" | "shared-4";
  price: number;
  totalAvailable: number;
  description: string;
  imageUrl: string | null;
  imageUrls: string[];
  imageFormats: ImageFormats[];
  conferenceId: string;
}

export interface RoomInfo { price: number; type: "private" | "shared-2" | "shared-4"; }

export interface RoomTypeWithAvailability extends RoomType {
  bookedCount: number;
  remaining: number;
}

interface StrapiRoomImage {
  url: string;
  formats: { thumbnail?: { url: string }; small?: { url: string }; medium?: { url: string }; large?: { url: string } } | null;
}

interface StrapiRoomTypeItem {
  id: number;
  documentId: string;
  type: "private" | "shared-2" | "shared-4";
  price: number;
  total_available: number;
  description: string;
  images: StrapiRoomImage[] | null;
  conferences: { documentId: string }[] | null;
}

function resolveImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_STRAPI_URL ?? ""}${url}`;
}

function mapRoomType(item: StrapiRoomTypeItem, conferenceId: string): RoomType {
  const images = item.images ?? [];
  const allUrls = images
    .map((img) => resolveImageUrl(img.url))
    .filter((url): url is string => url !== null);

  const imageFormats = images.map((img) => ({
    thumbnail: resolveImageUrl(img.formats?.thumbnail?.url),
    small: resolveImageUrl(img.formats?.small?.url),
    medium: resolveImageUrl(img.formats?.medium?.url),
    large: resolveImageUrl(img.formats?.large?.url),
  }));

  return {
    id: item.documentId,
    documentId: item.documentId,
    type: item.type,
    price: item.price,
    totalAvailable: item.total_available,
    description: item.description,
    imageUrl: allUrls[0] ?? null,
    imageUrls: allUrls,
    imageFormats,
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

export async function getRoomTypesWithAvailability(conferenceId: string): Promise<RoomTypeWithAvailability[]> {
  const roomTypes = await getRoomTypes(conferenceId);
  if (roomTypes.length === 0) return [];

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("room_groups")
    .select("room_type_id, bookings(id)")
    .eq("conference_id", conferenceId);

  const bookedCounts: Record<string, number> = {};
  if (bookings) {
    for (const group of bookings) {
      const typeId = group.room_type_id;
      const count = Array.isArray(group.bookings) ? group.bookings.length : 0;
      bookedCounts[typeId] = (bookedCounts[typeId] ?? 0) + count;
    }
  }

  return roomTypes.map((rt) => {
    const bookedCount = bookedCounts[rt.documentId] ?? 0;
    return {
      ...rt,
      bookedCount,
      remaining: calculateRoomAvailability(rt.totalAvailable, bookedCount),
    };
  });
}
