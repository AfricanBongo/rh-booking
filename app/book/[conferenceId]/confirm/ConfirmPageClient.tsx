"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WarningIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { StepIndicator } from "@/components/booking/StepIndicator";
import { PillButton } from "@/components/ui/PillButton";
import { useBookingFlow } from "@/stores/booking-flow";
import { PAYMENT_URGENCY_HOURS } from "@/lib/constants";

interface RoomInfo {
  price: number;
  type: "private" | "shared-2" | "shared-4";
}

interface ConfirmPageClientProps {
  conferenceId: string;
  conferenceName: string;
  checkIn: string;
  checkOut: string;
  roomPriceMap: Record<string, RoomInfo>;
  isUrgent: boolean;
}

const typeLabels: Record<string, string> = {
  private: "Private Room",
  "shared-2": "Shared Room (2)",
  "shared-4": "Shared Room (4)",
};

export function ConfirmPageClient({
  conferenceId,
  conferenceName,
  checkIn,
  checkOut,
  roomPriceMap,
  isUrgent,
}: ConfirmPageClientProps): React.ReactElement {
  const router = useRouter();
  const { selectedRoomTypeId, bedPreference, children, invitedRoommateId, reset } = useBookingFlow();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="h-96 animate-pulse bg-surface-secondary rounded-2xl" />;

  if (!selectedRoomTypeId && !submitting) {
    router.push(`/book/${conferenceId}`);
    return <div />;
  }

  const room = selectedRoomTypeId ? roomPriceMap[selectedRoomTypeId] : undefined;
  const isPrivate = room?.type === "private";
  const stepLabels = isPrivate
    ? ["Room", "Children", "Confirm"]
    : ["Room", "Children", "Roommate", "Confirm"];
  const totalSteps = stepLabels.length;
  const currentStep = totalSteps;

  const perPerson = room?.price ?? 30000;

  const total = perPerson;

  async function handleConfirm(): Promise<void> {
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conferenceId,
          roomTypeId: selectedRoomTypeId,
          roomType: room?.type ?? "shared-2",
          bedPreference,
          children,
          invitedRoommateId,
          roomPrice: room?.price ?? 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push("/pay");
      reset();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} labels={stepLabels} />
      </div>

      <h1 className="font-heading text-2xl md:text-3xl font-semibold mb-2">Confirm your booking</h1>
      <p className="text-muted mb-8">Review the details below before confirming.</p>

      <div className="border border-border rounded-2xl bg-surface overflow-hidden mb-6">
        <div className="p-5 space-y-4">
          <Row label="Conference" value={conferenceName} />
          <Row label="Room Type" value={typeLabels[room?.type ?? "private"]} />
          <Row label="Bed Preference" value={bedPreference === "king" ? "King Bed" : "Double Beds"} />
          <Row label="Check-in" value={formatDate(checkIn)} />
          <Row label="Check-out" value={formatDate(checkOut)} />
          {children.length > 0 && (
            <Row label="Children" value={`${children.length}`} />
          )}
          {!isPrivate && (
            <Row
              label="Roommate"
              value={invitedRoommateId ? "Invited (pending)" : "None"}
            />
          )}
        </div>

        <div className="border-t border-border p-5 bg-surface-secondary space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Room share ({typeLabels[room?.type ?? "private"]})</span>
            <span>${(perPerson / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
            <span>Total</span>
            <span>${(total / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {isUrgent && (
        <div className="border border-warning/30 bg-warning/5 rounded-2xl p-4 flex items-start gap-3 mb-6 animate-fade-in">
          <WarningIcon size={20} weight="duotone" className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Check-in is within {PAYMENT_URGENCY_HOURS} hours</p>
            <p className="text-xs text-muted mt-0.5">Payment is required to confirm your booking.</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <PillButton
          fullWidth
          size="lg"
          disabled={submitting}
          onClick={handleConfirm}
        >
          <CheckCircleIcon size={18} weight="bold" />
          Confirm & Make Deposit
        </PillButton>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}
