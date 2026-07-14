export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  churchBranch: string;
}

export interface ProfileUpdateData {
  fullName?: string;
  phone?: string;
  gender?: "male" | "female";
  churchBranch?: string;
}

export interface ChurchBranch {
  id: string;
  name: string;
}

export async function getProfile(userId: string): Promise<Profile> {
  void userId;
  throw new Error("not implemented");
}

export async function updateProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<Profile> {
  void userId;
  void data;
  throw new Error("not implemented");
}

export async function fetchChurchBranches(): Promise<ChurchBranch[]> {
  throw new Error("not implemented");
}
