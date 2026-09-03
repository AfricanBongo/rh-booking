import Image from "next/image";
import Link from "next/link";
import { getConferences } from "@/lib/data/conferences";
import { getMainPage } from "@/lib/data/main-page";
import { getMerchItems } from "@/lib/data/merch";
import { ConferenceCard } from "@/components/cards/ConferenceCard";
import { PillButton, Badge } from "@/components/ui";
import { UsersIcon, HouseIcon, UserPlusIcon, CreditCardIcon, CaretRightIcon, ShoppingBagIcon, CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr";

function formatConferenceDates(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const month = start.toLocaleString("en-US", { month: "long" });
  const year = start.getFullYear();
  return `${month} ${start.getDate()}–${end.getDate()}, ${year}`;
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const STEPS = [
  { icon: <UsersIcon size={24} weight="duotone" />, title: "Register", description: "Secure your spot at the conference in under a minute." },
  { icon: <HouseIcon size={24} weight="duotone" />, title: "Choose your room", description: "Private or shared. Pick what fits your budget." },
  { icon: <UserPlusIcon size={24} weight="duotone" />, title: "Share with a friend", description: "Invite someone from your branch and split the cost." },
  { icon: <CreditCardIcon size={24} weight="duotone" />, title: "Pay at your pace", description: "$25 minimum. Pay in installments before the deadline." },
];

export default async function Home(): Promise<React.ReactElement> {
  const [conferences, mainPage] = await Promise.all([
    getConferences(),
    getMainPage(),
  ]);

  const useCustomHero = mainPage?.heroSection?.isActive ?? false;
  const hero = useCustomHero ? null : (conferences[0] ?? null);
  const rest = useCustomHero ? conferences : conferences.slice(1);
  const daysLeft = hero ? daysUntil(hero.startDate) : 0;

  // Fetch real merch from Strapi for the first conference
  const merchItems = hero ? await getMerchItems(hero.id) : [];
  const merchPreview = merchItems.filter(m => m.merch_status === "open").slice(0, 3);

  return (
    <main>
      {/* ─── HERO ─── */}
      {useCustomHero && mainPage?.heroSection ? (
        <section className="relative min-h-[75vh] md:min-h-[85vh] flex items-end">
          {mainPage.heroSection.backgroundImageUrl ? (
            <Image src={mainPage.heroSection.backgroundImageUrl} alt="" fill className="object-cover" unoptimized priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface-secondary to-surface-tertiary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
            <div className="max-w-2xl animate-fade-up">
              <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-4">
                {mainPage.heroSection.heading}
              </h1>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-lg">
                {mainPage.heroSection.subheading}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <PillButton href={mainPage.heroSection.primaryCtaLink} size="lg">
                  {mainPage.heroSection.primaryCtaText}
                </PillButton>
                {mainPage.heroSection.secondaryCtaText && mainPage.heroSection.secondaryCtaLink && (
                  <PillButton href={mainPage.heroSection.secondaryCtaLink} size="lg" variant="outline">
                    {mainPage.heroSection.secondaryCtaText}
                  </PillButton>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative min-h-[75vh] md:min-h-[85vh] flex items-end">
          {hero?.imageUrl ? (
            <picture>
              {hero.portraitImageUrl && (
                <source media="(max-width: 768px)" srcSet={hero.portraitImageUrl} />
              )}
              <Image src={hero.imageUrl} alt={hero.name} fill className="object-cover" unoptimized priority />
            </picture>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface-secondary to-surface-tertiary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
            {hero ? (
              <div className="max-w-2xl animate-fade-up">
                <p className="text-sm font-medium tracking-wide text-white/60 uppercase mb-3">
                  {formatConferenceDates(hero.startDate, hero.endDate)} &middot; {hero.location}
                </p>
                <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-4">
                  {hero.name}
                </h1>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-lg">
                  Three days of worship, teaching, and community that will stay with you long after you leave.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <PillButton href={`/conferences/${hero.slug}`} size="lg">
                    Secure Your Spot
                  </PillButton>
                  {daysLeft > 0 && daysLeft <= 60 && (
                    <Badge variant="glass" size="md">
                      <CalendarDotsIcon size={14} />
                      {daysLeft} days away
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-xl animate-fade-up">
                <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
                  Where faith meets fellowship.
                </h1>
                <p className="text-lg text-muted mb-6">
                  Conferences, community, and unforgettable experiences. Stay tuned for upcoming events.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-2xl md:text-4xl font-semibold mb-3">
              From registration to room key
            </h2>
            <p className="text-muted text-base md:text-lg max-w-md mx-auto">
              Four steps. No stress. We handle the logistics so you can focus on the experience.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
            {STEPS.map(({ icon, title, description }) => (
              <div key={title} className="group border border-border bg-surface rounded-2xl p-6 hover:border-accent/30 hover:shadow-md transition-all duration-300 animate-fade-up">
                <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
                  {icon}
                </div>
                <h3 className="font-heading text-lg font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── UPCOMING CONFERENCES ─── */}
      {rest.length > 0 && (
        <section className="py-16 md:py-24 bg-surface-secondary">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-heading text-2xl md:text-4xl font-semibold mb-2">Upcoming Conferences</h2>
                <p className="text-muted">More gatherings on the horizon.</p>
              </div>
              <Link href="/conferences" className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                View all <CaretRightIcon size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
              {rest.map((conference) => (
                <ConferenceCard key={conference.id} conference={conference} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── MERCH / CONFERENCE GEAR ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium text-accent uppercase tracking-wide mb-1">Limited Collection</p>
              <h2 className="font-heading text-2xl md:text-4xl font-semibold">Wear the moment</h2>
              <p className="text-muted mt-2 max-w-md">
                Conference gear available for pickup at the event. Grab yours before they&apos;re gone.
              </p>
            </div>
            <Link href="/merch" className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              Shop all <CaretRightIcon size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {merchPreview.length > 0 ? merchPreview.map((item) => (
              <Link key={item.id} href={`/merch/${item.slug}`} className="group">
                <div className="border border-border bg-surface rounded-2xl overflow-hidden hover:border-accent/30 hover:shadow-md transition-all duration-300 animate-fade-up">
                  <div className="aspect-square bg-surface-secondary relative overflow-hidden">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBagIcon size={48} className="text-border" weight="thin" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium text-foreground group-hover:text-accent transition-colors">{item.name}</h3>
                    <p className="text-sm text-muted mt-0.5">${(item.price / 100).toFixed(0)}</p>
                  </div>
                </div>
              </Link>
            )) : (
              ["Kingdom Impact Tee", "Conference Hoodie", "Worship Mug"].map((name) => (
                <Link key={name} href="/merch" className="group">
                  <div className="border border-border bg-surface rounded-2xl overflow-hidden hover:border-accent/30 hover:shadow-md transition-all duration-300 animate-fade-up">
                    <div className="aspect-square bg-surface-secondary relative overflow-hidden flex items-center justify-center">
                      <ShoppingBagIcon size={48} className="text-border" weight="thin" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-medium text-foreground group-hover:text-accent transition-colors">{name}</h3>
                      <p className="text-sm text-muted mt-0.5">Coming soon</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="mt-6 md:hidden">
            <Link href="/merch" className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1">
              Shop all gear <CaretRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>

      {mainPage?.faqItems && mainPage.faqItems.length > 0 && (
        <section className="py-16 md:py-24 bg-surface-secondary">
          <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
            <h2 className="font-heading text-2xl md:text-4xl font-semibold text-center mb-3">Common questions</h2>
            <p className="text-muted text-center mb-10">Everything you need to know before you book.</p>
            <div>
              {mainPage.faqItems.map(({ question, answer }) => (
                <details key={question} className="group border-b border-border">
                  <summary className="cursor-pointer py-5 font-medium text-foreground flex items-center justify-between list-none select-none">
                    {question}
                    <svg
                      width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      className="text-muted shrink-0 ml-4 transition-transform duration-200 group-open:rotate-45"
                    >
                      <path d="M10 4v12M4 10h12" />
                    </svg>
                  </summary>
                  <p className="text-muted text-[15px] leading-relaxed pb-5 pr-8 animate-slide-up">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA BAND ─── */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl md:text-4xl font-semibold mb-3">Ready to join?</h2>
          <p className="text-muted text-base md:text-lg max-w-md mx-auto mb-8">
            Spots fill up fast. Register today and take your time with the rest.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <PillButton href={hero ? `/conferences/${hero.slug}` : (conferences[0] ? `/conferences/${conferences[0].slug}` : "/conferences")} size="lg">
              {hero || conferences[0] ? "Secure Your Spot" : "Browse Conferences"}
            </PillButton>
            <PillButton href="/merch" variant="outline" size="lg">
              Shop Merch
            </PillButton>
          </div>
        </div>
      </section>
    </main>
  );
}
