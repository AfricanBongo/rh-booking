import { getRoomTypesWithAvailability } from "@/lib/data/rooms";
import { getConference } from "@/lib/data/conferences";
import { RoomSelectionClient } from "./RoomSelectionClient";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react/dist/ssr";

interface PageProps {
  params: Promise<{ conferenceId: string }>;
}

export default async function RoomSelectionPage({ params }: PageProps): Promise<React.ReactElement> {
  const { conferenceId } = await params;
  const [roomTypes, conference] = await Promise.all([
    getRoomTypesWithAvailability(conferenceId),
    getConference(conferenceId),
  ]);

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5 mb-4">
        <XIcon size={14} /> Exit
      </Link>
      <div className="max-w-2xl mx-auto">
        <RoomSelectionClient
          conferenceId={conferenceId}
          conferenceSlug={conference.slug}
          conferenceName={conference.name}
          roomTypes={roomTypes}
        />
      </div>
    </main>
  );
}
