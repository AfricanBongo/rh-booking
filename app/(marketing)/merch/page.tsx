import Image from "next/image";
import Link from "next/link";
import { getConferences } from "@/lib/data/conferences";
import { getMerchItems } from "@/lib/data/merch";
import type { MerchItem } from "@/lib/data/merch";

function MerchCard({ item }: { item: MerchItem }): React.ReactElement {
  const isClosed = item.merch_status === "closed";

  return (
    <div className={`bg-surface rounded-xl shadow-sm overflow-hidden ${isClosed ? "opacity-60" : ""}`}>
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={400}
          height={400}
          className="w-full aspect-square object-cover"
          unoptimized
        />
      ) : (
        <div className="w-full aspect-square bg-surface-secondary" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading text-lg font-semibold">{item.name}</h3>
          {isClosed && (
            <span className="shrink-0 bg-surface-secondary text-muted text-xs font-medium px-2 py-0.5 rounded-full">
              Unavailable
            </span>
          )}
        </div>
        <p className="text-sm text-muted mb-3">${item.price.toFixed(2)}</p>
        {!isClosed && (
          <Link
            href={`/merch/${item.slug}`}
            className="border border-border text-foreground rounded-lg px-4 py-2 font-medium hover:bg-surface-secondary transition-colors inline-block text-sm"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function MerchPage(): Promise<React.ReactElement> {
  const conferences = await getConferences();
  const activeConference = conferences[0] ?? null;

  const items = activeConference
    ? await getMerchItems(activeConference.id)
    : [];

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
        Merchandise
      </h1>
      {activeConference && (
        <p className="text-muted mb-8">{activeConference.name}</p>
      )}

      {items.length === 0 ? (
        <p className="text-muted">No merchandise available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => (
            <MerchCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
