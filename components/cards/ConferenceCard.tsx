import Image from "next/image";
import Link from "next/link";
import type { Conference } from "@/lib/data/conferences";

interface ConferenceCardProps {
  conference: Conference;
}

function formatConferenceDates(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const month = start.toLocaleString("en-US", { month: "short" });
  const year = start.getFullYear();
  return `${month} ${start.getDate()}-${end.getDate()}, ${year}`;
}

export function ConferenceCard({ conference }: ConferenceCardProps): React.ReactElement {
  return (
    <div className="bg-surface rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 overflow-hidden">
      {conference.imageUrl ? (
        <Image
          src={conference.imageUrl}
          alt={conference.name}
          width={600}
          height={338}
          className="w-full aspect-video object-cover"
          unoptimized
        />
      ) : (
        <div className="w-full aspect-video bg-surface-secondary" />
      )}
      <div className="p-4">
        <h3 className="font-heading text-xl md:text-2xl font-semibold mb-1">
          {conference.name}
        </h3>
        <p className="text-sm text-muted mb-1">
          {formatConferenceDates(conference.startDate, conference.endDate)}
        </p>
        <p className="text-sm text-muted mb-4">{conference.location}</p>
        <Link
          href={`/conferences/${conference.slug}`}
          className="border border-border text-foreground rounded-lg px-6 py-3 font-medium hover:bg-surface-secondary transition-colors inline-block text-sm"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}
