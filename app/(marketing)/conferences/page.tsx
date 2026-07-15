import { getConferences } from "@/lib/data/conferences";
import { ConferenceCard } from "@/components/cards/ConferenceCard";

export default async function ConferencesPage(): Promise<React.ReactElement> {
  const conferences = await getConferences();

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl md:text-4xl font-bold mb-8">
        Upcoming Conferences
      </h1>

      {conferences.length === 0 ? (
        <p className="text-muted">No conferences available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {conferences.map((conference) => (
            <ConferenceCard key={conference.id} conference={conference} />
          ))}
        </div>
      )}
    </main>
  );
}
