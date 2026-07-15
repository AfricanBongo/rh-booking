import Image from "next/image";
import Link from "next/link";
import { getConferences } from "@/lib/data/conferences";
import { ConferenceCard } from "@/components/cards/ConferenceCard";

function formatConferenceDates(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const month = start.toLocaleString("en-US", { month: "short" });
  const year = start.getFullYear();
  return `${month} ${start.getDate()}-${end.getDate()}, ${year}`;
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const HOW_IT_WORKS = [
  { step: 1, title: "Register", description: "Sign up for the conference and secure your spot" },
  { step: 2, title: "Book a Room", description: "Choose your room type and bed preference" },
  { step: 3, title: "Invite Roommates", description: "Share your room and split the cost" },
  { step: 4, title: "Pay", description: "Pay in installments at your own pace" },
];

const FAQS = [
  {
    question: "Who can attend?",
    answer: "All members and guests of RoyalHouse Church branches are welcome.",
  },
  {
    question: "Can I attend without booking a room?",
    answer: "Yes, conference registration is separate from room booking.",
  },
  {
    question: "How does room payment work?",
    answer: "Room costs are split evenly among roommates. You can pay in installments with a minimum of $25 per payment.",
  },
  {
    question: "What is the children policy?",
    answer: "Children under 12 are free. Children 12 and older are charged at the per-person room rate.",
  },
];

export default async function Home(): Promise<React.ReactElement> {
  const conferences = await getConferences();
  const hero = conferences[0] ?? null;
  const rest = conferences.slice(1);

  return (
    <main>
      <section
        className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center"
        style={hero?.imageUrl ? undefined : { background: "var(--surface-secondary)" }}
      >
        {hero?.imageUrl && (
          <Image
            src={hero.imageUrl}
            alt={hero.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        )}
        {hero?.imageUrl && (
          <div className="absolute inset-0 bg-black/50" />
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center py-12 md:py-20">
          {hero ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-white/70 mb-4">
                Upcoming Conference
              </p>
              <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
                {hero.name}
              </h1>
              <p className="text-lg text-white/80 mb-2">
                {formatConferenceDates(hero.startDate, hero.endDate)}
              </p>
              <p className="text-base text-white/70 mb-6">{hero.location}</p>
              <div className="inline-flex items-center gap-2 mb-8">
                <span className="bg-warning/10 text-warning border border-warning/20 rounded-full px-3 py-1 text-sm">
                  {daysUntil(hero.paymentDeadline)} days until payment deadline
                </span>
              </div>
              <div>
                <Link
                  href={`/conferences/${hero.slug}`}
                  className="bg-accent text-accent-foreground rounded-lg px-8 py-4 font-medium text-lg hover:opacity-90 transition-opacity inline-block"
                >
                  Register Now
                </Link>
              </div>
            </>
          ) : (
            <p className="font-heading text-2xl md:text-4xl font-semibold text-foreground">
              Stay tuned for upcoming events
            </p>
          )}
        </div>
      </section>

      <section className="bg-surface-secondary py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="font-heading text-2xl md:text-4xl font-semibold text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step} className="bg-surface rounded-xl shadow-sm p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {rest.length > 0 && (
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <h2 className="font-heading text-2xl md:text-4xl font-semibold mb-8">
              Upcoming Conferences
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {rest.map((conference) => (
                <ConferenceCard key={conference.id} conference={conference} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 md:py-20 justify-items-center">
        <div className="max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="font-heading text-2xl md:text-4xl font-semibold mb-8">
            Frequently Asked Questions
          </h2>
          <div className="">
            {FAQS.map(({ question, answer }) => (
              <details key={question} className="border-b border-border py-4">
                <summary className="cursor-pointer font-medium list-none flex items-center justify-between">
                  {question}
                  <span className="text-muted ml-4">+</span>
                </summary>
                <p className="text-muted text-base mt-3">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
