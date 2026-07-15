import Image from "next/image";
import Link from "next/link";
import { getConferences } from "@/lib/data/conferences";
import { getMerchItems } from "@/lib/data/merch";
import type { MerchItem } from "@/lib/data/merch";
import { Badge } from "@/components/ui";
import {ShoppingBagIcon, TagIcon} from "@phosphor-icons/react/ssr";

function MerchCard({ item }: { item: MerchItem }): React.ReactElement {
  const isClosed = item.merch_status === "closed";

  return (
    <Link href={isClosed ? "#" : `/merch/${item.slug}`} className={`group ${isClosed ? "pointer-events-none" : ""}`}>
      <div className={`border border-border bg-surface rounded-2xl overflow-hidden transition-all duration-300 animate-fade-up ${isClosed ? "opacity-50" : "hover:border-accent/30 hover:shadow-md"}`}>
        <div className="relative aspect-square overflow-hidden bg-surface-secondary">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className={`object-cover transition-transform duration-500 ${isClosed ? "" : "group-hover:scale-105"}`}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBagIcon size={48} weight="thin" className="text-border" />
            </div>
          )}
          {isClosed && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" size="sm" className="bg-surface/90 backdrop-blur-sm">
                Unavailable
              </Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-base font-medium text-foreground group-hover:text-accent transition-colors">{item.name}</h3>
          <p className="text-sm text-muted mt-1 flex items-center gap-1">
            <TagIcon size={14} weight="duotone" />
            ${(item.price / 100).toFixed(0)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default async function MerchPage(): Promise<React.ReactElement> {
  const conferences = await getConferences();
  const activeConference = conferences[0] ?? null;
  const items = activeConference ? await getMerchItems(activeConference.id) : [];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-20">
      <div className="mb-10 md:mb-14">
        <p className="text-sm font-medium text-accent uppercase tracking-wide mb-1">Limited Collection</p>
        <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
          Conference Gear
        </h1>
        <p className="text-muted text-lg max-w-lg">
          {activeConference
            ? `Official merchandise for ${activeConference.name}. Available for pickup at the event.`
            : "Gear for upcoming conferences will appear here."}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBagIcon size={48} weight="duotone" className="mx-auto text-border mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">No merchandise yet</h2>
          <p className="text-muted">Check back closer to the conference date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {items.map((item) => (
            <MerchCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
