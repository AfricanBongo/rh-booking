"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, MagnifyingGlassIcon, PaperPlaneTiltIcon, InfoIcon, UserIcon } from "@phosphor-icons/react";
import { StepIndicator } from "@/components/booking/StepIndicator";
import { PillButton } from "@/components/ui/PillButton";
import { Badge } from "@/components/ui/Badge";
import { useBookingFlow } from "@/stores/booking-flow";

interface SearchResult {
  id: string;
  fullName: string;
  phone: string | null;
  gender: "male" | "female";
}

interface RoommatePageClientProps {
  conferenceId: string;
  maxOccupants: number;
}

export function RoommatePageClient({ conferenceId, maxOccupants }: RoommatePageClientProps): React.ReactElement {
  const router = useRouter();
  const { selectedRoomTypeId, invitedRoommateId, setInvitee } = useBookingFlow();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState<SearchResult | null>(null);
  const [relationship, setRelationship] = useState<"married" | "siblings" | "none" | null>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showSkipInfo, setShowSkipInfo] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/roommate-search?q=${encodeURIComponent(q)}&conferenceId=${conferenceId}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  if (!mounted) return <div className="h-96 animate-pulse bg-surface-secondary rounded-2xl" />;

  if (!selectedRoomTypeId) {
    router.push(`/book/${conferenceId}`);
    return <div />;
  }

  async function sendInvite(invitee: SearchResult, rel?: "married" | "siblings" | "none") {
    setInviteError(null);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomGroupId: null,
          inviteeId: invitee.id,
          relationship: rel,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresRelationship) {
          setShowRelationshipModal(invitee);
          return;
        }
        setInviteError(data.error ?? "Failed to send invitation");
        return;
      }

      setInvitee(invitee.id, rel);
      setInviteSent(true);
      setShowRelationshipModal(null);
      setQuery("");
      setResults([]);
    } catch {
      setInviteError("Failed to send invitation");
    }
  }

  function handleInviteClick(invitee: SearchResult) {
    sendInvite(invitee);
  }

  function confirmRelationship() {
    if (!showRelationshipModal || !relationship) return;
    if (relationship === "none") {
      setInviteError("Opposite genders cannot share unless married or siblings");
      return;
    }
    sendInvite(showRelationshipModal, relationship);
  }

  const slotsRemaining = maxOccupants - 1 - (invitedRoommateId ? 1 : 0);

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <StepIndicator currentStep={3} totalSteps={4} />
      </div>

      <h1 className="font-heading text-2xl md:text-3xl font-semibold mb-2">Find a roommate</h1>
      <p className="text-muted mb-8">Search for someone registered for this conference to share with.</p>

      {inviteSent && (
        <div className="border border-success/30 bg-success/5 rounded-2xl p-4 mb-6 animate-fade-in">
          <p className="text-sm font-medium text-success">Invitation sent! They'll be notified.</p>
        </div>
      )}

      {!invitedRoommateId && slotsRemaining > 0 && (
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or phone number..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {loading && (
            <div className="mt-3 text-sm text-muted">Searching...</div>
          )}

          {results.length > 0 && (
            <div className="mt-3 border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {results.map((person) => (
                <div key={person.id} className="flex items-center gap-3 p-3 bg-surface hover:bg-surface-secondary transition-colors">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                    <UserIcon size={16} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{person.fullName}</p>
                    {person.phone && <p className="text-xs text-muted">{person.phone}</p>}
                  </div>
                  <Badge variant="soft" size="sm">{person.gender}</Badge>
                  <button
                    type="button"
                    onClick={() => handleInviteClick(person)}
                    className="h-8 px-3 rounded-full bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
                  >
                    <PaperPlaneTiltIcon size={12} weight="bold" />
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}

          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="mt-3 text-sm text-muted">No results found.</div>
          )}

          {inviteError && (
            <div className="mt-3 text-sm text-danger">{inviteError}</div>
          )}
        </div>
      )}

      {invitedRoommateId && (
        <div className="border border-accent/30 bg-accent/5 rounded-2xl p-4 mb-6 animate-fade-in">
          <p className="text-sm font-medium">Roommate invited</p>
          <p className="text-xs text-muted mt-1">They'll receive a notification to accept or decline.</p>
        </div>
      )}

      {!showSkipInfo && !invitedRoommateId && (
        <button
          type="button"
          onClick={() => setShowSkipInfo(true)}
          className="text-sm text-accent hover:text-accent/80 transition-colors mb-6 block"
        >
          Skip for now
        </button>
      )}

      {showSkipInfo && (
        <div className="border border-border bg-surface-secondary rounded-2xl p-4 mb-6 flex items-start gap-3 animate-fade-in">
          <InfoIcon size={18} className="text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">You can invite a roommate later from your dashboard.</p>
            <button
              type="button"
              onClick={() => router.push(`/book/${conferenceId}/confirm`)}
              className="text-sm font-medium text-accent mt-2 hover:text-accent/80 transition-colors"
            >
              Got it, continue
            </button>
          </div>
        </div>
      )}

      {showRelationshipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowRelationshipModal(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-sm w-full animate-scale-in">
            <h3 className="font-heading font-semibold text-lg mb-2">Relationship</h3>
            <p className="text-sm text-muted mb-4">
              You and {showRelationshipModal.fullName} are different genders. What is your relationship?
            </p>
            <div className="space-y-2 mb-4">
              {(["married", "siblings", "none"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRelationship(opt)}
                  className={[
                    "w-full py-3 px-4 rounded-xl border text-sm font-medium capitalize text-left transition-all duration-200",
                    relationship === opt ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-accent/30",
                  ].join(" ")}
                >
                  {opt === "none" ? "Neither (just friends/acquaintances)" : opt === "married" ? "Married" : "Siblings"}
                </button>
              ))}
            </div>
            {relationship === "none" && (
              <p className="text-xs text-danger mb-3">Opposite genders cannot share unless married or siblings.</p>
            )}
            <div className="flex gap-2">
              <PillButton variant="outline" size="sm" onClick={() => { setShowRelationshipModal(null); setRelationship(null); }}>
                Cancel
              </PillButton>
              <PillButton
                size="sm"
                fullWidth
                disabled={!relationship || relationship === "none"}
                onClick={confirmRelationship}
              >
                Confirm & Invite
              </PillButton>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <PillButton
          variant="outline"
          onClick={() => router.push(`/book/${conferenceId}/children`)}
        >
          <ArrowLeftIcon size={16} />
          Back
        </PillButton>
        <PillButton
          fullWidth
          onClick={() => router.push(`/book/${conferenceId}/confirm`)}
        >
          Continue
        </PillButton>
      </div>
    </div>
  );
}
