type SearchType = "name" | "phone";

interface SearchableProfile {
  id: string;
  fullName: string;
  phone: string;
  gender: "male" | "female";
}

interface SearchResult {
  id: string;
  fullName: string;
  phone: string | null;
  gender: "male" | "female";
}

export function detectSearchType(query: string): SearchType {
  const digitsOnly = query.replace(/[\s\-().+]/g, "");
  if (/^\d+$/.test(digitsOnly) && digitsOnly.length >= 3) return "phone";
  return "name";
}

export function applySearchPrivacy(profile: SearchableProfile, searchType: SearchType): SearchResult {
  return {
    id: profile.id,
    fullName: profile.fullName,
    phone: searchType === "name" ? profile.phone : null,
    gender: profile.gender,
  };
}
