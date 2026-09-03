import { strapiGet } from "@/lib/strapi";

export interface DiningPass {
  id: string;
  documentId: string;
  name: string;
  description: string | null;
  price: number;
  mealsCovered: number;
}

interface StrapiDiningPassItem {
  id: number;
  documentId: string;
  name: string;
  description: string | null;
  price: number;
  meals_covered: number;
}

function mapDiningPass(item: StrapiDiningPassItem): DiningPass {
  return {
    id: item.documentId,
    documentId: item.documentId,
    name: item.name,
    description: item.description,
    price: item.price,
    mealsCovered: item.meals_covered,
  };
}

export async function getDiningPassesForConference(conferenceId: string): Promise<DiningPass[]> {
  try {
    const result = await strapiGet<StrapiDiningPassItem[]>("/api/dining-passes", {
      "filters[conferences][documentId][$eq]": conferenceId,
      "publicationState": "live",
    });
    return result.data.map(mapDiningPass);
  } catch {
    return [];
  }
}
