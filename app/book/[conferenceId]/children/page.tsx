import { getRoomTypes } from "@/lib/data/rooms";
import { ChildrenPageClient } from "./ChildrenPageClient";

interface PageProps {
  params: Promise<{ conferenceId: string }>;
}

export default async function ChildrenPage({ params }: PageProps): Promise<React.ReactElement> {
  const { conferenceId } = await params;
  const roomTypes = await getRoomTypes(conferenceId);

  const roomPriceMap = Object.fromEntries(
    roomTypes.map((rt) => [rt.id, { price: rt.price, type: rt.type }])
  );

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <ChildrenPageClient
          conferenceId={conferenceId}
          roomPriceMap={roomPriceMap}
        />
      </div>
    </main>
  );
}
