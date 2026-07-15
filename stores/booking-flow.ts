import { create } from "zustand";

export interface ChildEntry {
  age: number;
  gender: "male" | "female";
}

interface BookingFlowState {
  conferenceId: string | null;
  selectedRoomTypeId: string | null;
  bedPreference: "king" | "double" | null;
  children: ChildEntry[];
  invitedRoommateId: string | null;
  relationshipType: "married" | "siblings" | "none" | null;

  setConferenceId: (id: string) => void;
  setRoomType: (id: string) => void;
  setBedPreference: (pref: "king" | "double") => void;
  addChild: (child: ChildEntry) => void;
  removeChild: (index: number) => void;
  setChildren: (children: ChildEntry[]) => void;
  setInvitee: (id: string | null, relationship?: "married" | "siblings" | "none") => void;
  reset: () => void;
}

const initialState = {
  conferenceId: null,
  selectedRoomTypeId: null,
  bedPreference: null,
  children: [] as ChildEntry[],
  invitedRoommateId: null,
  relationshipType: null,
};

export const useBookingFlow = create<BookingFlowState>((set) => ({
  ...initialState,

  setConferenceId: (id) => set({ conferenceId: id }),
  setRoomType: (id) => set({ selectedRoomTypeId: id }),
  setBedPreference: (pref) => set({ bedPreference: pref }),
  addChild: (child) => set((s) => ({ children: [...s.children, child] })),
  removeChild: (index) => set((s) => ({ children: s.children.filter((_, i) => i !== index) })),
  setChildren: (children) => set({ children }),
  setInvitee: (id, relationship) => set({ invitedRoommateId: id, relationshipType: relationship ?? null }),
  reset: () => set(initialState),
}));
