import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getConferences } from "@/lib/data/conferences";
import { PillButton, Badge } from "@/components/ui";
import {
  MapPinIcon,
  CalendarDotsIcon,
  MegaphoneIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Conference } from "@/lib/data/conferences";

type BookingStatus = "booked" | "registered" | "available";

function getStatus(conferenceId: string, bookedIds: Set<string>, registeredIds: Set<string>): BookingStatus {
  if (bookedIds.has(conferenceId)) return "booked";
  if (registeredIds.has(conferenceId)) return "registered";
  return "available";
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function ConferenceCard({
  conference,
  status,
}: {
  conference: Conference;
  status: BookingStatus;
}): React.ReactElement {
  return (
    <div className="border border-border bg-surface rounded-2xl overflow-hidden hover:border-accent/30 hover:shadow-md transition-all duration-300">
      <div className="aspect-[16/10] relative bg-surface-secondary">
        {conference.imageUrl ? (
          <Image
            src={conference.imageUrl}
            alt={conference.name}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MegaphoneIcon size={48} weight="thin" className="text-border" />
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold">{conference.name}</h3>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon size={14} weight="duotone" />
            {conference.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDotsIcon size={14} weight="duotone" />
            {formatDateRange(conference.startDate, conference.endDate)}
          </span>
        </div>
        <ActionButton conference={conference} status={status} />
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }): React.ReactElement {
  if (status === "booked") {
    return <Badge size="sm" className="bg-success/10 text-success">Booked</Badge>;
  }
  if (status === "registered") {
    return <Badge size="sm" className="bg-accent/10 text-accent">Registered</Badge>;
  }
  return <Badge size="sm" className="bg-surface-secondary text-muted">Available</Badge>;
}

export function ActionButton({ conference, status }: { conference: Conference; status: BookingStatus }): React.ReactElement {
  if (status === "booked") {
    return <PillButton href="/dashboard" variant="outline" size="sm">View Booking</PillButton>;
  }
  if (status === "registered") {
    return <PillButton href={`/book/${conference.id}`} size="sm">Book a Room</PillButton>;
  }
  return <PillButton href={`/dashboard/conferences/${conference.slug}`} size="sm">Register</PillButton>;
}

export default async function ConferencesPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const conferences = await getConferences();
  const { data: registrations } = await supabase.from("conference_registrations").select("conference_id").eq("user_id", user.id);
  const { data: bookings } = await supabase.from("bookings").select("conference_id").eq("user_id", user.id).eq("status", "confirmed");

  const registeredIds = new Set(registrations?.map(r => r.conference_id) ?? []);
  const bookedIds = new Set(bookings?.map(b => b.conference_id) ?? []);

  if (conferences.length === 0) {
    return (
      <main className="px-6 md:px-8 py-8 max-w-4xl">
        <div className="animate-fade-up">
          <h1 className="font-heading text-2xl font-semibold">Conferences</h1>
          <p className="text-muted mt-1">Browse upcoming conferences and manage your registrations.</p>
        </div>
        <div className="border border-border bg-surface rounded-2xl p-12 text-center mt-8 animate-fade-up">
          <MegaphoneIcon size={56} weight="thin" className="mx-auto text-border mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">No upcoming conferences</h2>
          <p className="text-muted">Check back later for new conference announcements.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 md:px-8 py-8 max-w-4xl">
      <div className="animate-fade-up">
        <h1 className="font-heading text-2xl font-semibold">Conferences</h1>
        <p className="text-muted mt-1">Browse upcoming conferences and manage your registrations.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-fade-up stagger">
        {conferences.map(conference => (
          <ConferenceCard
            key={conference.id}
            conference={conference}
            status={getStatus(conference.id, bookedIds, registeredIds)}
          />
        ))}
      </div>
    </main>
  );
}
