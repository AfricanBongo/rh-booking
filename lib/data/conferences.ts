export interface Conference {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  registrationDeadline: string;
}

export async function getConferences(): Promise<Conference[]> {
  throw new Error("not implemented");
}

export async function getConference(id: string): Promise<Conference> {
  void id;
  throw new Error("not implemented");
}
