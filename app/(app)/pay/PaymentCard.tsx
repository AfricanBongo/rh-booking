"use client";

import { useState } from "react";
import { CurrencyDollarIcon, CheckCircleIcon, ReceiptIcon } from "@phosphor-icons/react";
import { PillButton } from "@/components/ui/PillButton";
import { Badge } from "@/components/ui/Badge";
import { MIN_PAYMENT_AMOUNT } from "@/lib/constants";

interface PaymentCardProps {
  bookingId: string;
  conferenceName: string;
  totalPrice: number;
  amountPaid: number;
}

const PRESETS = [2500, 5000, 10000];

export function PaymentCard({ bookingId, conferenceName, totalPrice, amountPaid }: PaymentCardProps): React.ReactElement {
  const remainingBalance = totalPrice - amountPaid;
  const isPaidInFull = remainingBalance <= 0;
  const progressPercent = Math.round((amountPaid / totalPrice) * 100);

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cashSubmitting, setCashSubmitting] = useState(false);
  const [cashSuccess, setCashSuccess] = useState<number | false>(false);
  const [cashError, setCashError] = useState<string | null>(null);

  function getAmount(): number {
    if (selectedPreset) return selectedPreset;
    const parsed = Math.round(parseFloat(customAmount) * 100);
    return isNaN(parsed) ? 0 : parsed;
  }

  function handlePresetClick(amount: number): void {
    setSelectedPreset(amount);
    setCustomAmount("");
  }

  function handleCustomChange(value: string): void {
    setCustomAmount(value);
    setSelectedPreset(null);
  }

  function handlePayFull(): void {
    setSelectedPreset(remainingBalance);
    setCustomAmount("");
  }

  async function handleSubmit(): Promise<void> {
    const amount = getAmount();
    if (amount < MIN_PAYMENT_AMOUNT || amount > remainingBalance) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "room_payment",
          bookingId,
          amount,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCashPayment(): Promise<void> {
    const amount = getAmount();
    if (amount < MIN_PAYMENT_AMOUNT || amount > remainingBalance) return;

    setCashSubmitting(true);
    setCashError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cash_invoice",
          bookingId,
          amount,
          description: `${conferenceName} - Room Payment`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.invoiceId) {
        setCashSuccess(amount);
      } else {
        setCashError(data?.error || "Something went wrong. Please try again.");
      }
    } catch {
      setCashError("Network error. Please check your connection and try again.");
    } finally {
      setCashSubmitting(false);
    }
  }

  const amount = getAmount();
  const isValidAmount = amount >= MIN_PAYMENT_AMOUNT && amount <= remainingBalance;

  return (
    <div className="border border-border bg-surface rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold">{conferenceName}</h3>
        {isPaidInFull && (
          <Badge variant="soft" className="bg-success/10 text-success shrink-0">Paid in Full</Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">${(amountPaid / 100).toFixed(2)} of ${(totalPrice / 100).toFixed(2)}</span>
          <span className="font-medium">{progressPercent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted">
          <span>${(amountPaid / 100).toFixed(2)} paid</span>
          <span>${(remainingBalance / 100).toFixed(2)} remaining</span>
        </div>
      </div>

      {isPaidInFull ? (
        <div className="flex items-center gap-2 pt-2">
          <CheckCircleIcon size={20} weight="bold" className="text-success" />
          <span className="text-sm font-medium text-success">All payments complete</span>
        </div>
      ) : (
        <div className="space-y-4 pt-2 border-t border-border">
          {cashSuccess ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircleIcon size={32} weight="bold" className="text-success" />
              <p className="text-sm font-medium">Cash payment of ${((cashSuccess as number) / 100).toFixed(2)} registered</p>
              <p className="text-xs text-muted">Show this to your church admin to mark as received.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    disabled={preset > remainingBalance}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedPreset === preset
                        ? "bg-accent text-accent-foreground"
                        : "border border-border text-foreground hover:border-accent/30"
                    } disabled:opacity-40 disabled:pointer-events-none`}
                  >
                    ${preset / 100}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePayFull}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    selectedPreset === remainingBalance
                      ? "bg-accent text-accent-foreground"
                      : "border border-border text-foreground hover:border-accent/30"
                  }`}
                >
                  Pay Full
                </button>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`custom-${bookingId}`} className="text-xs font-medium text-muted">
                  Custom amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input
                    id={`custom-${bookingId}`}
                    type="number"
                    min={MIN_PAYMENT_AMOUNT / 100}
                    max={remainingBalance / 100}
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    placeholder="25.00"
                    className="w-full rounded-xl border border-border bg-surface py-2.5 pl-7 pr-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>

              {cashError && (
                <p className="text-sm text-danger">{cashError}</p>
              )}

              <div className="flex gap-3">
                <PillButton
                  size="md"
                  fullWidth
                  disabled={!isValidAmount || submitting || cashSubmitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    <>
                      <CurrencyDollarIcon size={18} />
                      Pay ${isValidAmount ? (amount / 100).toFixed(2) : "..."}
                    </>
                  )}
                </PillButton>
                <button
                  type="button"
                  disabled={!isValidAmount || submitting || cashSubmitting}
                  onClick={handleCashPayment}
                  className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent/30 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
                >
                  {cashSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                      Registering...
                    </span>
                  ) : (
                    <>
                      <ReceiptIcon size={18} />
                      Pay with Cash
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
