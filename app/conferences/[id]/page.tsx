import Image from "next/image";
import Link from "next/link";
import { getConference } from "@/lib/data/conferences";
import { createClient } from "@/lib/supabase/server";
import { RegistrationForm } from "@/components/forms/RegistrationForm";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const month = start.toLocaleString("en-US", { month: "short" });
  const year = start.getFullYear();
  return `${month} ${start.getDate()}-${end.getDate()}, ${year}`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConferenceDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;

  let conference;
  try {
    conference = await getConference(id);
  } catch {
    return (
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <Link href="/" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-6">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          All Conferences
        </Link>
        <div className="bg-surface rounded-xl p-8 text-center">
          <p className="text-lg font-medium text-foreground mb-2">Conference not found</p>
          <p className="text-muted mb-6">This conference may have been removed or the link is incorrect.</p>
          <Link href="/" className="bg-accent text-accent-foreground rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity inline-block">
            Back to Home
          </Link>
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
      .eq("conference_id", id)
      .maybeSingle();
    isRegistered = !!data;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Link href="/" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-6">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        All Conferences
      </Link>

      <div className="h-64 md:h-96 relative rounded-2xl overflow-hidden">
        {conference.imageUrl ? (
          <Image
            src={conference.imageUrl}
            alt={conference.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-surface-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-white mb-1">
              {conference.name}
            </h1>
            <p className="text-white/80 text-base">
              {formatDateRange(conference.startDate, conference.endDate)} &middot; {conference.location}
            </p>
          </div>
          <div className="md:shrink-0">
            {!isRegistered && conference.isActive && user && (
              <a
                href="#register"
                className="bg-accent text-accent-foreground rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity inline-block"
              >
                Register Now
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-surface rounded-xl p-4 flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent mt-0.5 shrink-0" aria-hidden="true">
            <rect x="3" y="4" width="14" height="14" rx="2" />
            <path d="M3 8h14M7 2v4M13 2v4" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Conference Dates</p>
            <p className="text-sm font-medium text-foreground">{formatDateRange(conference.startDate, conference.endDate)}</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl p-4 flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent mt-0.5 shrink-0" aria-hidden="true">
            <path d="M10 2C7.239 2 5 4.239 5 7c0 4 5 11 5 11s5-7 5-11c0-2.761-2.239-5-5-5z" />
            <circle cx="10" cy="7" r="2" />
          </svg>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Location</p>
            <p className="text-sm font-medium text-foreground">{conference.location}</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl p-4 flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="10" cy="10" r="7" />
            <path d="M10 6v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">Payment Deadline</p>
            <p className="text-sm font-medium text-foreground">{formatDate(conference.paymentDeadline)}</p>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-2xl font-semibold mb-3">About This Conference</h2>
        <p className="text-foreground leading-relaxed">{conference.description}</p>
      </section>

      <section id="register" className="mt-8 bg-surface rounded-xl p-6">
        {!user && (
          <>
            <h2 className="font-heading text-xl font-semibold mb-2">Register for This Conference</h2>
            <p className="text-muted mb-4">Sign in to register for this conference and book your room.</p>
            <Link
              href={`/auth/login?returnUrl=/conferences/${id}`}
              className="bg-accent text-accent-foreground rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity inline-block"
            >
              Sign in to Register
            </Link>
          </>
        )}

        {user && isRegistered && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-success" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-semibold text-success">You&apos;re registered!</h2>
            </div>
            <p className="text-muted mb-4">You&apos;re all set for {conference.name}. Ready to book your room?</p>
            <Link
              href={`/book/${id}`}
              className="bg-accent text-accent-foreground rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity inline-block"
            >
              Book a Room
            </Link>
          </>
        )}

        {user && !isRegistered && !conference.isActive && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="text-warning" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <h2 className="font-heading text-xl font-semibold">Registration Closed</h2>
            </div>
            <p className="text-muted">Registration is closed for this conference.</p>
          </>
        )}

        {user && !isRegistered && conference.isActive && (
          <>
            <h2 className="font-heading text-xl font-semibold mb-1">Register for This Conference</h2>
            <p className="text-muted text-sm mb-6">Select your check-in and check-out dates within the conference window.</p>
            <RegistrationForm
              conferenceId={id}
              conferenceStartDate={conference.startDate}
              conferenceEndDate={conference.endDate}
            />
          </>
        )}
      </section>
    </main>
  );
}
