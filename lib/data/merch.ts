export interface MerchItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sizes: string[];
  conferenceId: string;
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  conferenceId: string;
}

export async function getMerchItems(conferenceId: string): Promise<MerchItem[]> {
  void conferenceId;
  throw new Error("not implemented");
}

export async function getMerchItem(id: string): Promise<MerchItem> {
  void id;
  throw new Error("not implemented");
}

export async function getPickupLocations(
  conferenceId: string
): Promise<PickupLocation[]> {
  void conferenceId;
  throw new Error("not implemented");
}
