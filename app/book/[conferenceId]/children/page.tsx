import { getRoomTypes } from "@/lib/data/rooms";
import { getDiningPassesForConference } from "@/lib/data/dining-passes";
import { ChildrenPageClient } from "./ChildrenPageClient";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react/dist/ssr";

interface PageProps {
  params: Promise<{ conferenceId: string }>;
}

export default async function ChildrenPage({ params }: PageProps): Promise<React.ReactElement> {
  const { conferenceId } = await params;
  const [roomTypes, diningPasses] = await Promise.all([
    getRoomTypes(conferenceId),
    getDiningPassesForConference(conferenceId),
  ]);

  const roomPriceMap = Object.fromEntries(
    roomTypes.map((rt) => [rt.id, { price: rt.price, type: rt.type }])
  );

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5 mb-4">
        <XIcon size={14} /> Exit
      </Link>
      <div className="max-w-2xl mx-auto">
        <ChildrenPageClient
          conferenceId={conferenceId}
          roomPriceMap={roomPriceMap}
          hasDiningPasses={diningPasses.length > 0}
        />
      </div>
    </main>
  );
}
