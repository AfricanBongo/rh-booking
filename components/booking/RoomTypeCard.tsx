"use client";

import { Badge } from "@/components/ui/Badge";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { calculatePerPersonPrice } from "@/lib/utils/price";

interface RoomTypeCardProps {
  id: string;
  type: "private" | "shared-2" | "shared-4";
  description: string;
  price: number;
  imageUrls: string[];
  remaining: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onImageClick: (roomId: string, index: number) => void;
}

const typeLabels: Record<string, string> = {
  private: "Private Room",
  "shared-2": "Shared Room (2 guests)",
  "shared-4": "Shared Room (4 guests)",
};

const maxOccupants: Record<string, number> = {
  private: 1,
  "shared-2": 2,
  "shared-4": 4,
};

export function RoomTypeCard({
  id,
  type,
  description,
  price,
  imageUrls,
  remaining,
  isSelected,
  onSelect,
  onImageClick,
}: RoomTypeCardProps): React.ReactElement {
  const soldOut = remaining === 0;
  const perPerson = calculatePerPersonPrice(price, maxOccupants[type]);

  return (
    <div
      className={[
        "w-full border rounded-2xl p-4 md:p-5 transition-all duration-300",
        "flex gap-4 md:gap-6 items-start",
        isSelected ? "border-accent bg-accent/5 shadow-md" : "border-border bg-surface hover:border-accent/30 hover:shadow-sm",
        soldOut ? "opacity-50" : "",
      ].join(" ")}
    >
      <ImageSlider
        images={imageUrls}
        alt={typeLabels[type]}
        transitionName={`room-img-${id}`}
        onImageClick={(index) => onImageClick(id, index)}
        className="w-20 h-20 md:w-28 md:h-28 shrink-0"
      />

      <button
        type="button"
        disabled={soldOut}
        onClick={() => onSelect(id)}
        className={[
          "flex-1 min-w-0 text-left",
          soldOut ? "cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-lg">{typeLabels[type]}</h3>
          {soldOut ? (
            <Badge variant="outline" className="bg-danger/10 text-danger border-danger/30">Sold Out</Badge>
          ) : remaining <= 3 ? (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">{remaining} left</Badge>
          ) : (
            <Badge variant="outline">{remaining} available</Badge>
          )}
        </div>
        <p className="text-sm text-muted mt-1 line-clamp-2">{description}</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-xl font-heading font-bold">${(perPerson / 100).toFixed(0)}</span>
          <span className="text-sm text-muted">/person</span>
        </div>
      </button>

      <button
        type="button"
        disabled={soldOut}
        onClick={() => onSelect(id)}
        className={[
          "w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-colors",
          isSelected ? "border-accent bg-accent" : "border-border",
          soldOut ? "cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
      </button>
    </div>
  );
}
