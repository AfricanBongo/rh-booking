import { create } from "zustand";

export interface AdditionalGuest {
  age: number;
}

export type ChildEntry = AdditionalGuest;

interface BookingFlowState {
  conferenceId: string | null;
  selectedRoomTypeId: string | null;
  bedPreference: "king" | "double" | null;
  guests: AdditionalGuest[];
  invitedRoommateId: string | null;
  relationshipType: "married" | "siblings" | "none" | null;

  setConferenceId: (id: string) => void;
  setRoomType: (id: string) => void;
  setBedPreference: (pref: "king" | "double") => void;
  addGuest: (guest: AdditionalGuest) => void;
  removeGuest: (index: number) => void;
  setGuests: (guests: AdditionalGuest[]) => void;
  setInvitee: (id: string | null, relationship?: "married" | "siblings" | "none") => void;
  reset: () => void;

  children: AdditionalGuest[];
  addChild: (child: AdditionalGuest) => void;
  removeChild: (index: number) => void;
  setChildren: (children: AdditionalGuest[]) => void;
}

const initialState = {
  conferenceId: null as string | null,
  selectedRoomTypeId: null as string | null,
  bedPreference: null as "king" | "double" | null,
  guests: [] as AdditionalGuest[],
  invitedRoommateId: null as string | null,
  relationshipType: null as "married" | "siblings" | "none" | null,
};

export const useBookingFlow = create<BookingFlowState>((set, get) => ({
  ...initialState,

  setConferenceId: (id) => set({ conferenceId: id }),
  setRoomType: (id) => set({ selectedRoomTypeId: id }),
  setBedPreference: (pref) => set({ bedPreference: pref }),
  addGuest: (guest) => set((s) => ({ guests: [...s.guests, guest] })),
  removeGuest: (index) => set((s) => ({ guests: s.guests.filter((_, i) => i !== index) })),
  setGuests: (guests) => set({ guests }),
  setInvitee: (id, relationship) => set({ invitedRoommateId: id, relationshipType: relationship ?? null }),
  reset: () => set(initialState),

  get children() { return get().guests; },
  addChild: (child) => get().addGuest(child),
  removeChild: (index) => get().removeGuest(index),
  setChildren: (children) => get().setGuests(children),
}));
