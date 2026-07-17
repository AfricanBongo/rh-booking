interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiError {
  status: number;
  name: string;
  message: string;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function strapiGet<T>(
  path: string,
  params?: Record<string, string>
): Promise<StrapiResponse<T>> {
  const url = new URL(path, STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value)
    );
  }

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (STRAPI_TOKEN) {
    headers["Authorization"] = `Bearer ${STRAPI_TOKEN}`;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    const error: StrapiError = {
      status: response.status,
      name: "StrapiError",
      message: `Strapi request failed: ${response.status} ${response.statusText}`,
    };
    throw error;
  }

  return response.json() as Promise<StrapiResponse<T>>;
}
