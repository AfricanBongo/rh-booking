"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { StepIndicator } from "@/components/booking/StepIndicator";
import { PillButton } from "@/components/ui/PillButton";
import { useBookingFlow } from "@/stores/booking-flow";
import type { DiningPass } from "@/lib/data/dining-passes";

interface DiningPassClientProps {
  conferenceId: string;
  diningPasses: DiningPass[];
}

export function DiningPassClient({ conferenceId, diningPasses }: DiningPassClientProps): React.ReactElement {
  const router = useRouter();
  const {
    selectedRoomTypeId,
    guests,
    myDiningPassId,
    setMyDiningPass,
    setGuestDiningPass,
  } = useBookingFlow();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="h-96 animate-pulse bg-surface-secondary rounded-2xl" />;

  if (!selectedRoomTypeId) {
    router.push(`/book/${conferenceId}`);
    return <div />;
  }

  if (diningPasses.length === 0) {
    router.replace(`/book/${conferenceId}/roommate`);
    return <div />;
  }

  const stepLabels = ["Room", "Guests", "Dining", "Confirm"];

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <StepIndicator currentStep={3} totalSteps={stepLabels.length} labels={stepLabels} />
      </div>

      <h1 className="font-heading text-2xl md:text-3xl font-semibold mb-2">Dining passes</h1>
      <p className="text-muted mb-8">Add a dining pass for yourself or your guests. This is optional.</p>

      <div className="mb-6">
        <h2 className="font-heading text-lg font-semibold mb-3">Your dining pass</h2>
        <div className="space-y-3">
          <PassOption
            selected={!myDiningPassId}
            onClick={() => setMyDiningPass(null)}
            label="No dining pass"
            sublabel="I'll handle my own meals"
          />
          {diningPasses.map((pass) => (
            <PassOption
              key={pass.id}
              selected={myDiningPassId === pass.id}
              onClick={() => setMyDiningPass(pass.id)}
              label={pass.name}
              sublabel={pass.description ?? undefined}
              detail={`${pass.mealsCovered} meals covered`}
              price={pass.price}
            />
          ))}
        </div>
      </div>

      {guests.length > 0 && (
        <div className="space-y-6">
          {guests.map((guest, i) => (
            <div key={i}>
              <h2 className="font-heading text-lg font-semibold mb-3">Guest {i + 1} (age {guest.age})</h2>
              <div className="space-y-3">
                <PassOption
                  selected={!guest.diningPassId}
                  onClick={() => setGuestDiningPass(i, null)}
                  label="No dining pass"
                />
                {diningPasses.map((pass) => (
                  <PassOption
                    key={pass.id}
                    selected={guest.diningPassId === pass.id}
                    onClick={() => setGuestDiningPass(i, pass.id)}
                    label={pass.name}
                    detail={`${pass.mealsCovered} meals`}
                    price={pass.price}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <PillButton variant="outline" onClick={() => router.push(`/book/${conferenceId}/children`)}>
          <ArrowLeftIcon size={16} />
          Back
        </PillButton>
        <PillButton
          fullWidth
          onClick={() => router.push(`/book/${conferenceId}/roommate`)}
        >
          Continue
        </PillButton>
      </div>
    </div>
  );
}

interface PassOptionProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  sublabel?: string;
  detail?: string;
  price?: number;
}

function PassOption({ selected, onClick, label, sublabel, detail, price }: PassOptionProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full border rounded-2xl p-4 text-left transition-all duration-200",
        selected ? "border-accent bg-accent/5" : "border-border bg-surface hover:border-accent/30",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{label}</p>
          {sublabel && <p className="text-sm text-muted mt-0.5">{sublabel}</p>}
          {detail && <p className="text-xs text-muted mt-1">{detail}</p>}
        </div>
        {typeof price === "number" && (
          <span className="text-lg font-heading font-bold">${(price / 100).toFixed(0)}</span>
        )}
      </div>
    </button>
  );
}
