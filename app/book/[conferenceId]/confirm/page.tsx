import { createClient } from "@/lib/supabase/server";
import { getRoomTypes } from "@/lib/data/rooms";
import { getConference } from "@/lib/data/conferences";
import { getDiningPassesForConference } from "@/lib/data/dining-passes";
import { ConfirmPageClient } from "./ConfirmPageClient";
import { redirect } from "next/navigation";
import { PAYMENT_URGENCY_HOURS } from "@/lib/constants";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react/dist/ssr";

interface PageProps {
  params: Promise<{ conferenceId: string }>;
}

export default async function ConfirmPage({ params }: PageProps): Promise<React.ReactElement> {
  const { conferenceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [conference, roomTypes, diningPasses] = await Promise.all([
    getConference(conferenceId),
    getRoomTypes(conferenceId),
    getDiningPassesForConference(conferenceId),
  ]);

  const checkIn = conference.checkIn;
  const checkOut = conference.checkOut;

  const now = new Date();
  const checkInDate = new Date(checkIn);
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isUrgent = hoursUntilCheckIn <= PAYMENT_URGENCY_HOURS;

  const roomPriceMap = Object.fromEntries(
    roomTypes.map((rt) => [rt.id, { price: rt.price, type: rt.type }])
  );

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5 mb-4">
        <XIcon size={14} /> Exit
      </Link>
      <div className="max-w-2xl mx-auto">
        <ConfirmPageClient
          conferenceId={conferenceId}
          conferenceName={conference.name}
          checkIn={checkIn}
          checkOut={checkOut}
          roomPriceMap={roomPriceMap}
          isUrgent={isUrgent}
          diningPasses={diningPasses}
        />
      </div>
    </main>
  );
}
