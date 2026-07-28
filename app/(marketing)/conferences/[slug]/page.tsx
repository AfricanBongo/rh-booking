import Image from "next/image";
import Link from "next/link";
import { getConferenceBySlug } from "@/lib/data/conferences";
import { createClient } from "@/lib/supabase/server";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { PillButton, LocalizedDate, LocalizedDateRange } from "@/components/ui";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { CalendarDotsIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, CheckIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConferenceDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;

  let conference;
  try {
    conference = await getConferenceBySlug(slug);
  } catch {
    return (
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <Link href="/conferences" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5 mb-6">
          <ArrowLeftIcon size={16} /> All Conferences
        </Link>
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <p className="text-lg font-medium text-foreground mb-2">Conference not found</p>
          <p className="text-muted mb-6">This conference may have been removed or the link is incorrect.</p>
          <PillButton href="/conferences">
            Browse Conferences
          </PillButton>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isRegistered = false;
  if (user) {
    const { data } = await supabase
      .from("conference_registrations")
      .select("id")
      .eq("user_id", user.id)
      .eq("conference_id", conference.id)
      .maybeSingle();
    isRegistered = !!data;
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative h-64 md:h-[420px] overflow-hidden">
        {conference.imageUrl ? (
          <Image src={conference.imageUrl} alt={conference.name} fill className="object-cover" unoptimized priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-surface-tertiary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <Link href="/conferences" className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1.5 mb-4 transition-colors">
              <ArrowLeftIcon size={16} /> All Conferences
            </Link>
            <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-2">
              {conference.name}
            </h1>
            <p className="text-white/70 text-base md:text-lg">
              <LocalizedDateRange startIso={conference.startDate} endIso={conference.endDate} /> &middot; {conference.location}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Info cards */}
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
          <MarkdownContent content={conference.description} />
        </section>

        {/* Registration */}
        <section id="register">
          <div className="border border-border bg-surface rounded-2xl p-6">
              {!user && (
                <>
                  <h2 className="font-heading text-xl font-semibold mb-2">Register for This Conference</h2>
                  <p className="text-muted mb-4">Sign in to register and book your room.</p>
                  <PillButton href={`/auth/login?returnUrl=/conferences/${slug}`}>
                    Sign in to Register
                  </PillButton>
                </>
              )}

              {user && isRegistered && (
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
                  <PillButton href={`/book/${conference.id}`}>
                    Book a Room
                  </PillButton>
                </>
              )}

              {user && !isRegistered && !conference.isActive && (
                <div className="flex items-center gap-3">
                  <WarningIcon size={20} weight="duotone" className="text-warning shrink-0" />
                  <div>
                    <h2 className="font-heading text-lg font-semibold">Registration Closed</h2>
                    <p className="text-sm text-muted">Registration is no longer available for this conference.</p>
                  </div>
                </div>
              )}

              {user && !isRegistered && conference.isActive && (
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
      </div>
    </main>
  );
}
