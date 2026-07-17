"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, XIcon, WarningIcon } from "@phosphor-icons/react";
import { StepIndicator } from "@/components/booking/StepIndicator";
import { PillButton } from "@/components/ui/PillButton";
import { useBookingFlow, type ChildEntry } from "@/stores/booking-flow";
import { calculateChildrenSurcharge } from "@/lib/utils/children";
import { calculatePerPersonPrice } from "@/lib/utils/price";

interface RoomInfo {
  price: number;
  type: "private" | "shared-2" | "shared-4";
}

interface ChildrenPageClientProps {
  conferenceId: string;
  roomPriceMap: Record<string, RoomInfo>;
}

const maxOccupantsMap: Record<string, number> = {
  private: 1,
  "shared-2": 2,
  "shared-4": 4,
};

export function ChildrenPageClient({ conferenceId, roomPriceMap }: ChildrenPageClientProps): React.ReactElement {
  const router = useRouter();
  const { selectedRoomTypeId, children, setChildren } = useBookingFlow();
  const [hasChildren, setHasChildren] = useState(children.length > 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="h-96 animate-pulse bg-surface-secondary rounded-2xl" />;

  if (!selectedRoomTypeId) {
    router.push(`/book/${conferenceId}`);
    return <div />;
  }

  const room = roomPriceMap[selectedRoomTypeId];
  const maxOccupants = room ? maxOccupantsMap[room.type] : 1;
  const perPersonRate = calculatePerPersonPrice(room?.price ?? 30000, maxOccupants);
  const surcharge = calculateChildrenSurcharge(children, perPersonRate);
  const billableCount = children.filter((c) => c.age >= 12).length;

  function toggleChildren(on: boolean) {
    setHasChildren(on);
    if (!on) setChildren([]);
  }

  function addChild() {
    setChildren([...children, { age: 1, gender: "male" }]);
  }

  function removeChild(index: number) {
    setChildren(children.filter((_, i) => i !== index));
  }

  function updateChild(index: number, field: keyof ChildEntry, value: number | "male" | "female") {
    const updated = children.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    setChildren(updated);
  }

  const isPrivate = room?.type === "private";
  const totalSteps = isPrivate ? 3 : 4;
  const stepLabels = isPrivate ? ["Room", "Children", "Confirm"] : ["Room", "Children", "Roommate", "Confirm"];

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <StepIndicator currentStep={2} totalSteps={totalSteps} labels={stepLabels} />
      </div>

      <h1 className="font-heading text-2xl md:text-3xl font-semibold mb-2">Children attending</h1>
      <p className="text-muted mb-8">Let us know if any children will be joining you.</p>

      <div className="border border-border rounded-2xl p-5 bg-surface mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">I have children attending</p>
            <p className="text-sm text-muted">Children under 12 stay free. Ages 12+ are charged.</p>
          </div>
          <button
            type="button"
            onClick={() => toggleChildren(!hasChildren)}
            className={[
              "w-12 h-7 rounded-full transition-colors duration-200 relative",
              hasChildren ? "bg-accent" : "bg-border",
            ].join(" ")}
          >
            <div
              className={[
                "w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform duration-200",
                hasChildren ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {hasChildren && (
        <div className="space-y-4 animate-fade-in">
          {children.length === 0 && (
            <button
              type="button"
              onClick={addChild}
              className="w-full border border-dashed border-border rounded-2xl p-6 text-center text-muted hover:border-accent/30 hover:text-accent transition-colors"
            >
              <PlusIcon size={24} className="mx-auto mb-2" />
              <span className="text-sm font-medium">Add a child</span>
            </button>
          )}

          {children.map((child, i) => (
            <div key={i} className="border border-border rounded-2xl p-4 bg-surface animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Age</label>
                    <input
                      type="number"
                      min={1}
                      max={17}
                      value={child.age}
                      onChange={(e) => updateChild(i, "age", Math.max(1, Math.min(17, Number(e.target.value))))}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                    {child.age >= 12 && (
                      <p className="text-xs text-warning mt-1 flex items-center gap-1">
                        <WarningIcon size={12} weight="bold" />
                        Charged as additional occupant (+${(perPersonRate / 100).toFixed(0)})
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Gender</label>
                    <div className="flex gap-2">
                      {(["male", "female"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updateChild(i, "gender", g)}
                          className={[
                            "flex-1 py-2 px-3 rounded-xl border text-sm font-medium capitalize transition-all duration-200",
                            child.gender === g
                              ? "border-accent bg-accent/5 text-accent"
                              : "border-border hover:border-accent/30",
                          ].join(" ")}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeChild(i)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <XIcon size={16} weight="bold" />
                </button>
              </div>
            </div>
          ))}

          {children.length > 0 && (
            <button
              type="button"
              onClick={addChild}
              className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors px-1"
            >
              <PlusIcon size={16} weight="bold" />
              Add another child
            </button>
          )}

          {billableCount > 0 && (
            <div className="border border-warning/30 bg-warning/5 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
              <WarningIcon size={20} weight="duotone" className="text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  {billableCount} child{billableCount > 1 ? "ren" : ""} aged 12+ will be charged as additional occupant{billableCount > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  +${(surcharge / 100).toFixed(0)} added to your booking total
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <PillButton
          variant="outline"
          onClick={() => router.push(`/book/${conferenceId}`)}
        >
          <ArrowLeftIcon size={16} />
          Back
        </PillButton>
        <PillButton
          fullWidth
          onClick={() => {
            const nextStep = isPrivate ? `confirm` : `roommate`;
            router.push(`/book/${conferenceId}/${nextStep}`);
          }}
        >
          Continue
        </PillButton>
      </div>
    </div>
  );
}
