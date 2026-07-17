import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import type { Conference } from "@/lib/data/conferences";

interface ConferenceCardProps {
  conference: Conference;
}

function formatConferenceDates(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const month = start.toLocaleString("en-US", { month: "short" });
  const year = start.getFullYear();
  return `${month} ${start.getDate()}–${end.getDate()}, ${year}`;
}

export function ConferenceCard({ conference }: ConferenceCardProps): React.ReactElement {
  return (
    <Link href={`/conferences/${conference.slug}`} className="group">
      <div className="border border-border bg-surface rounded-2xl overflow-hidden hover:border-accent/30 hover:shadow-md transition-all duration-300 animate-fade-up">
        <div className="relative aspect-[16/10] overflow-hidden">
          {conference.imageUrl ? (
            <Image
              src={conference.imageUrl}
              alt={conference.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-surface-tertiary" />
          )}
        </div>
        <div className="p-5">
          <Badge variant="soft" size="sm" className="mb-2">
            {formatConferenceDates(conference.startDate, conference.endDate)}
          </Badge>
          <h3 className="font-heading text-xl font-semibold mb-1 group-hover:text-accent transition-colors">
            {conference.name}
          </h3>
          <p className="text-sm text-muted flex items-center gap-1.5">
            <MapPinIcon size={14} weight="duotone" className="shrink-0" />
            {conference.location}
          </p>
        </div>
      </div>
    </Link>
  );
}
