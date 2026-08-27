"use client";

import { useState } from "react";
import { MapTrifoldIcon, WarningCircleIcon, CheckCircleIcon, ReceiptIcon, CurrencyDollarIcon } from "@phosphor-icons/react";
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
  const [cashSubmitting, setCashSubmitting] = useState(false);
  const [cashSuccess, setCashSuccess] = useState<number | false>(false);

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

  async function handleCashPurchase(): Promise<void> {
    if (!pickupLocationId && pickupLocations.length > 0) return;
    setCashSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cash_invoice",
          merchItemId,
          merchItemName,
          pickupLocationId: pickupLocationId || "none",
          amount: price,
          description: merchItemName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }

      const data = await res.json();
      if (data.invoiceId) {
        setCashSuccess(price);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setCashSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {cashSuccess ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircleIcon size={32} weight="bold" className="text-success" />
          <p className="text-sm font-medium">Cash payment has been requested</p>
          <p className="text-xs text-muted">We have let the admin know. You may proceed to submit the cash for this payment. If payment does not reflect within a couple of minutes after admin clearing your invoice, please let the admin know.</p>
        </div>
      ) : (
        <>
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
          <div className="flex flex-col md:flex-row gap-3">
            <PillButton
              size="lg"
              fullWidth
              disabled={submitting || cashSubmitting || (pickupLocations.length > 0 && !pickupLocationId)}
              onClick={handlePurchase}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
                  Processing...
                </span>
              ) : (
                <>
                  <CurrencyDollarIcon size={18} />
                  Pay ${(price / 100).toFixed(2)} online
                </>
              )}
            </PillButton>
            <PillButton
              size="lg"
              fullWidth
              variant="outline"
              disabled={submitting || cashSubmitting || (pickupLocations.length > 0 && !pickupLocationId)}
              onClick={handleCashPurchase}
            >
              {cashSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  Requesting...
                </span>
              ) : (
                <>
                  <ReceiptIcon size={18} />
                  Pay ${(price / 100).toFixed(2)} in cash
                </>
              )}
            </PillButton>
          </div>
        </>
      )}
    </div>
  );
}
