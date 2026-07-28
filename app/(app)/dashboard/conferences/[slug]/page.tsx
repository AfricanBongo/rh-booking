import Image from "next/image";
import Link from "next/link";
import { getConferenceBySlug } from "@/lib/data/conferences";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { PillButton, LocalizedDate, LocalizedDateRange } from "@/components/ui";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { CalendarDotsIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, CheckIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DashboardConferenceDetailPage({ params }: Props): Promise<React.ReactElement> {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let conference;
  try {
    conference = await getConferenceBySlug(slug);
  } catch {
    return (
      <main className="px-6 md:px-8 py-8">
        <Link href="/dashboard/conferences" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5 mb-6">
          <ArrowLeftIcon size={16} /> Back to Conferences
        </Link>
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <p className="text-lg font-medium text-foreground mb-2">Conference not found</p>
          <p className="text-muted mb-6">This conference may have been removed or the link is incorrect.</p>
          <PillButton href="/dashboard/conferences">Browse Conferences</PillButton>
        </div>
      </main>
    );
  }

  const { data: registration } = await supabase
    .from("conference_registrations")
    .select("id")
    .eq("user_id", user.id)
    .eq("conference_id", conference.id)
    .maybeSingle();
  const isRegistered = !!registration;

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, total_price, amount_paid, status")
    .eq("user_id", user.id)
    .eq("conference_id", conference.id)
    .eq("status", "confirmed")
    .maybeSingle();

  return (
    <main className="px-6 md:px-8 py-8 animate-fade-up">
      <Link href="/dashboard/conferences" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5 mb-6 transition-colors">
        <ArrowLeftIcon size={16} /> Back to Conferences
      </Link>

      {conference.imageUrl && (
        <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8">
          <Image src={conference.imageUrl} alt={conference.name} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">{conference.name}</h1>
          </div>
        </div>
      )}

      {!conference.imageUrl && (
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-6">{conference.name}</h1>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="border border-border bg-surface rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <CalendarDotsIcon size={20} weight="duotone" className="text-accent" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Dates</p>
            <p className="text-sm font-medium text-foreground">
              <LocalizedDateRange startIso={conference.startDate} endIso={conference.endDate} />
            </p>
          </div>
        </div>

        <div className="border border-border bg-surface rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <MapPinIcon size={20} weight="duotone" className="text-accent" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Location</p>
            <p className="text-sm font-medium text-foreground">{conference.location}</p>
          </div>
        </div>

        <div className="border border-border bg-surface rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <ClockIcon size={20} weight="duotone" className="text-accent" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Payment Deadline</p>
            <p className="text-sm font-medium text-foreground">
              <LocalizedDate iso={conference.paymentDeadline} />
            </p>
          </div>
        </div>
      </div>

      <section className="mb-10">
        <section className="mb-10">
          <MarkdownContent content={conference.description} />
        </section>
      </section>

      <section>
        <div className="border border-border bg-surface rounded-2xl p-6">
          {isRegistered && booking && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckIcon size={20} weight="bold" className="text-success" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-success">Room Booked</h2>
                  <p className="text-sm text-muted">You have a confirmed booking for {conference.name}.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted mb-4">
                <span>Total: ${(booking.total_price / 100).toFixed(0)}</span>
                <span>Paid: ${(booking.amount_paid / 100).toFixed(0)}</span>
              </div>
              <PillButton href="/pay">Make a Payment</PillButton>
            </>
          )}

          {isRegistered && !booking && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckIcon size={20} weight="bold" className="text-success" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-success">You&apos;re registered!</h2>
                  <p className="text-sm text-muted">You&apos;re all set for {conference.name}.</p>
                </div>
              </div>
              <PillButton href={`/book/${conference.id}`}>Book a Room</PillButton>
            </>
          )}

          {!isRegistered && !conference.isActive && (
            <div className="flex items-center gap-3">
              <WarningIcon size={20} weight="duotone" className="text-warning shrink-0" />
              <div>
                <h2 className="font-heading text-lg font-semibold">Registration Closed</h2>
                <p className="text-sm text-muted">Registration is no longer available for this conference.</p>
              </div>
            </div>
          )}

          {!isRegistered && conference.isActive && (
            <>
              <h2 className="font-heading text-xl font-semibold mb-1">Register for This Conference</h2>
              <p className="text-muted text-sm mb-6">Check-in and check-out times are set for all attendees.</p>
              <RegistrationForm
                conferenceId={conference.id}
                conferenceCheckIn={conference.checkIn}
                conferenceCheckOut={conference.checkOut}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
