export function createStrapiResponse<T>(data: T, meta = {}) {
  return { data, meta };
}
