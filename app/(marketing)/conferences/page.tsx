import { getConferences } from "@/lib/data/conferences";
import { ConferenceCard } from "@/components/cards/ConferenceCard";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";

export default async function ConferencesPage(): Promise<React.ReactElement> {
  const conferences = await getConferences();

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-20">
      <div className="mb-10 md:mb-14">
        <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
          Upcoming Conferences
        </h1>
        <p className="text-muted text-lg max-w-lg">
          Find your next gathering. Register, book a room, and pay at your pace.
        </p>
      </div>

      {conferences.length === 0 ? (
        <div className="text-center py-20">
          <CalendarBlankIcon size={48} weight="duotone" className="mx-auto text-border mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">No conferences yet</h2>
          <p className="text-muted">Stay tuned. New events are announced regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {conferences.map((conference) => (
            <ConferenceCard key={conference.id} conference={conference} />
          ))}
        </div>
      )}
    </main>
  );
}
