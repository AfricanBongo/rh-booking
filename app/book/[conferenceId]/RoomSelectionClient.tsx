"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { StepIndicator } from "@/components/booking/StepIndicator";
import { RoomTypeCard } from "@/components/booking/RoomTypeCard";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { PillButton } from "@/components/ui/PillButton";
import { useBookingFlow } from "@/stores/booking-flow";
import type { RoomTypeWithAvailability } from "@/lib/data/rooms";

interface RoomSelectionClientProps {
  conferenceId: string;
  conferenceSlug: string;
  conferenceName: string;
  roomTypes: RoomTypeWithAvailability[];
}

export function RoomSelectionClient({ conferenceId, conferenceSlug, conferenceName, roomTypes }: RoomSelectionClientProps): React.ReactElement {
  const router = useRouter();
  const { selectedRoomTypeId, bedPreference, setRoomType, setBedPreference, setConferenceId } = useBookingFlow();
  const [mounted, setMounted] = useState(false);
  const [lightbox, setLightbox] = useState<{ roomId: string; index: number } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setConferenceId(conferenceId);
    setMounted(true);
  }, [conferenceId, setConferenceId]);

  function openLightbox(roomId: string, index: number) {
    startTransition(() => {
      setLightbox({ roomId, index });
    });
  }

  function closeLightbox() {
    startTransition(() => {
      setLightbox(null);
    });
  }

  if (!mounted) return <div className="h-96 animate-pulse bg-surface-secondary rounded-2xl" />;

  const canContinue = selectedRoomTypeId && bedPreference;
  const selectedRoom = selectedRoomTypeId ? roomTypes.find((r) => r.id === selectedRoomTypeId) : null;
  const isPrivate = selectedRoom?.type === "private";
  const totalSteps = isPrivate ? 3 : 4;
  const stepLabels = isPrivate ? ["Room", "Children", "Confirm"] : ["Room", "Children", "Roommate", "Confirm"];
  const lightboxRoom = lightbox ? roomTypes.find((r) => r.id === lightbox.roomId) : null;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <StepIndicator currentStep={1} totalSteps={totalSteps} labels={stepLabels} />
      </div>

      <h1 className="font-heading text-2xl md:text-3xl font-semibold mb-2">Choose your room</h1>
      <p className="text-muted mb-8">Select a room type and bed preference for {conferenceName}.</p>

      <div className="space-y-4 mb-8">
        {roomTypes.map((rt) => (
          <RoomTypeCard
            key={rt.id}
            id={rt.id}
            type={rt.type}
            description={rt.description}
            price={rt.price}
            imageUrls={rt.imageUrls}
            remaining={rt.remaining}
            isSelected={selectedRoomTypeId === rt.id}
            onSelect={setRoomType}
            onImageClick={openLightbox}
          />
        ))}
      </div>

      {selectedRoomTypeId && (
        <div className="border border-border rounded-2xl p-5 bg-surface animate-fade-in mb-8">
          <h2 className="font-heading font-semibold text-lg mb-1">Bed Preference</h2>
          <p className="text-sm text-muted mb-4">This is a preference, not a guarantee.</p>
          <div className="flex gap-3">
            {(["king", "double"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBedPreference(option)}
                className={[
                  "flex-1 py-3 px-4 rounded-xl border text-sm font-medium capitalize transition-all duration-200",
                  bedPreference === option
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border bg-surface hover:border-accent/30",
                ].join(" ")}
              >
                {option === "king" ? "King Bed" : "Double Beds"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <PillButton
          variant="outline"
          href={`/conferences/${conferenceSlug}`}
        >
          <ArrowLeftIcon size={16} />
          Back
        </PillButton>
        <PillButton
          fullWidth
          disabled={!canContinue}
          onClick={() => router.push(`/book/${conferenceId}/children`)}
        >
          Continue
        </PillButton>
      </div>

      {lightbox && lightboxRoom && (
        <ImageLightbox
          images={lightboxRoom.imageUrls}
          initialIndex={lightbox.index}
          transitionName={`room-img-${lightbox.roomId}`}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
