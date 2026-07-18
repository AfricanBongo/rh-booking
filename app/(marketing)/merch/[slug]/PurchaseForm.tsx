"use client";

import { useState } from "react";
import { MapTrifoldIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { PillButton } from "@/components/ui";

interface PickupLocation {
  id: string;
  name: string;
  address: string;
}

interface PurchaseFormProps {
  merchItemId: string;
  merchItemName: string;
  merchItemSlug: string;
  price: number;
  pickupLocations: PickupLocation[];
}

export function PurchaseForm({
  merchItemId,
  merchItemName,
  merchItemSlug,
  price,
  pickupLocations,
}: PurchaseFormProps): React.ReactElement {
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase(): Promise<void> {
    if (!pickupLocationId && pickupLocations.length > 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "merch",
          merchItemId,
          merchItemName,
          merchItemSlug,
          pickupLocationId: pickupLocationId || "none",
          amount: price,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {pickupLocations.length > 0 && (
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
            <MapTrifoldIcon size={16} weight="duotone" />
            Pickup Location
          </label>
          <select
            value={pickupLocationId}
            onChange={(e) => setPickupLocationId(e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-3.5 text-foreground bg-background focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200"
          >
            <option value="">Select a pickup location</option>
            {pickupLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} - {loc.address}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3" role="alert">
          <WarningCircleIcon size={18} weight="duotone" className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}
      <PillButton
        size="lg"
        fullWidth
        disabled={submitting || (pickupLocations.length > 0 && !pickupLocationId)}
        onClick={handlePurchase}
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            Processing...
          </span>
        ) : (
          "Purchase"
        )}
      </PillButton>
    </div>
  );
}
