import { describe, it, expect, beforeEach } from "vitest";
import { useBookingFlow } from "./booking-flow";

beforeEach(() => {
  useBookingFlow.getState().reset();
});

describe("guest management", () => {
  it("addGuest adds one guest", () => {
    useBookingFlow.getState().addGuest({ age: 10 });
    expect(useBookingFlow.getState().guests.length).toBe(1);
  });

  it("addGuest then removeGuest results in empty guests", () => {
    useBookingFlow.getState().addGuest({ age: 10 });
    useBookingFlow.getState().removeGuest(0);
    expect(useBookingFlow.getState().guests.length).toBe(0);
  });

  it("setGuests replaces the array", () => {
    const g1 = { age: 5 };
    const g2 = { age: 8 };
    useBookingFlow.getState().setGuests([g1, g2]);
    expect(useBookingFlow.getState().guests.length).toBe(2);
  });

  it("initial state has no guests", () => {
    expect(useBookingFlow.getState().guests.length).toBe(0);
  });
});

describe("booking flow state", () => {
  it("setConferenceId sets conferenceId", () => {
    useBookingFlow.getState().setConferenceId("conf-1");
    expect(useBookingFlow.getState().conferenceId).toBe("conf-1");
  });

  it("setRoomType sets selectedRoomTypeId", () => {
    useBookingFlow.getState().setRoomType("rt-1");
    expect(useBookingFlow.getState().selectedRoomTypeId).toBe("rt-1");
  });

  it("setBedPreference sets bedPreference", () => {
    useBookingFlow.getState().setBedPreference("king");
    expect(useBookingFlow.getState().bedPreference).toBe("king");
  });

  it("setInvitee sets invitedRoommateId and relationshipType", () => {
    useBookingFlow.getState().setInvitee("user-1", "married");
    expect(useBookingFlow.getState().invitedRoommateId).toBe("user-1");
    expect(useBookingFlow.getState().relationshipType).toBe("married");
  });

  it("setInvitee(null) clears both fields", () => {
    useBookingFlow.getState().setInvitee("user-1", "married");
    useBookingFlow.getState().setInvitee(null);
    expect(useBookingFlow.getState().invitedRoommateId).toBeNull();
    expect(useBookingFlow.getState().relationshipType).toBeNull();
  });
});

describe("reset", () => {
  it("reset clears all state to initial values", () => {
    useBookingFlow.getState().setConferenceId("conf-1");
    useBookingFlow.getState().addGuest({ age: 5 });
    useBookingFlow.getState().reset();
    const s = useBookingFlow.getState();
    expect(s.conferenceId).toBeNull();
    expect(s.guests).toHaveLength(0);
  });
});

describe("backward compatibility", () => {
  it("children getter reflects guests when accessed via store", () => {
    useBookingFlow.getState().addGuest({ age: 5 });
    expect(useBookingFlow.getState().guests.length).toBe(1);
    expect(useBookingFlow.getState().guests[0].age).toBe(5);
  });

  it("addChild increases guests.length", () => {
    useBookingFlow.getState().addChild({ age: 5 });
    expect(useBookingFlow.getState().guests.length).toBe(1);
  });

  it("setChildren replaces guests", () => {
    useBookingFlow.getState().setChildren([{ age: 8 }]);
    expect(useBookingFlow.getState().guests.length).toBe(1);
  });
});
