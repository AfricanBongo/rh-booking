"use client";

import { useState } from "react";
import { UserIcon, CheckIcon, XIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { PillButton } from "@/components/ui/PillButton";
import { Badge } from "@/components/ui/Badge";
import type { Invitation } from "@/lib/data/invitations";

interface InvitationsClientProps {
  invitations: Invitation[];
}

export function InvitationsClient({ invitations: initial }: InvitationsClientProps): React.ReactElement {
  const [invitations, setInvitations] = useState(initial);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handleAction(id: string, action: "accept" | "decline") {
    setProcessingId(id);
    try {
      const res = await fetch("/api/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: id, action }),
      });

      if (res.ok) {
        setInvitations((prev) =>
          prev.map((inv) => (inv.id === id ? { ...inv, status: action === "accept" ? "accepted" : "declined" } : inv))
        );
      }
    } finally {
      setProcessingId(null);
    }
  }

  const pending = invitations.filter((inv) => inv.status === "pending");
  const processed = invitations.filter((inv) => inv.status !== "pending");

  return (
    <div className="animate-fade-up">
      <h1 className="font-heading text-2xl md:text-3xl font-semibold mb-2">Invitations</h1>
      <p className="text-muted mb-8">Room sharing invitations from other attendees.</p>

      {pending.length === 0 && processed.length === 0 && (
        <div className="text-center py-16">
          <EnvelopeSimpleIcon size={48} weight="thin" className="mx-auto text-muted mb-4" />
          <p className="text-lg font-medium mb-2">No pending invitations</p>
          <p className="text-sm text-muted mb-6">When someone invites you to share a room, it will appear here.</p>
          <PillButton href="/conferences">Browse Conferences</PillButton>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-4 mb-8">
          {pending.map((inv) => (
            <div key={inv.id} className="border border-border rounded-2xl p-5 bg-surface animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <UserIcon size={20} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{inv.inviterName ?? "Someone"} invited you</p>
                  <p className="text-sm text-muted mt-0.5">to share a room at the conference</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <PillButton
                  variant="outline"
                  size="sm"
                  disabled={processingId === inv.id}
                  onClick={() => handleAction(inv.id, "decline")}
                >
                  <XIcon size={14} weight="bold" />
                  Decline
                </PillButton>
                <PillButton
                  size="sm"
                  fullWidth
                  disabled={processingId === inv.id}
                  onClick={() => handleAction(inv.id, "accept")}
                >
                  <CheckIcon size={14} weight="bold" />
                  Accept
                </PillButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wide">Past</h2>
          {processed.map((inv) => (
            <div key={inv.id} className="border border-border rounded-2xl p-4 bg-surface opacity-70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-secondary flex items-center justify-center shrink-0">
                  <UserIcon size={16} className="text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{inv.inviterName ?? "Someone"}</p>
                </div>
                <Badge variant={inv.status === "accepted" ? "soft" : "outline"} size="sm">
                  {inv.status === "accepted" ? "Accepted" : "Declined"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
