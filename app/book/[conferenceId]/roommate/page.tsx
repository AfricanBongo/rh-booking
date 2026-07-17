import { getRoomTypes } from "@/lib/data/rooms";
import { RoommatePageClient } from "./RoommatePageClient";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react/dist/ssr";

interface PageProps {
  params: Promise<{ conferenceId: string }>;
}

const maxOccupantsMap: Record<string, number> = {
  private: 1,
  "shared-2": 2,
  "shared-4": 4,
};

export default async function RoommatePage({ params }: PageProps): Promise<React.ReactElement> {
  const { conferenceId } = await params;
  const roomTypes = await getRoomTypes(conferenceId);

  const sharedRoom = roomTypes.find((rt) => rt.type !== "private");
  const maxOccupants = sharedRoom ? maxOccupantsMap[sharedRoom.type] : 2;

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5 mb-4">
        <XIcon size={14} /> Exit
      </Link>
      <div className="max-w-2xl mx-auto">
        <RoommatePageClient conferenceId={conferenceId} maxOccupants={maxOccupants} />
      </div>
    </main>
  );
}
