import Image from "next/image";
import Link from "next/link";
import { getMerchItemBySlug, getPickupLocations } from "@/lib/data/merch";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MerchDetailPage({ params }: Props): Promise<React.ReactElement> {
  const { slug } = await params;

  let item;
  try {
    item = await getMerchItemBySlug(slug);
  } catch {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 text-center">
        <h1 className="font-heading text-2xl font-semibold mb-2">Item not found</h1>
        <p className="text-muted mb-6">This item may have been removed.</p>
        <Link href="/merch" className="bg-accent text-accent-foreground rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity">
          Back to Merch
        </Link>
      </div>
    );
  }

  const pickupLocations = await getPickupLocations(item.conferenceId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isClosed = item.merch_status === "closed";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <Link href="/merch" className="text-sm text-muted hover:text-foreground mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All Merchandise
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <div>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={600}
              height={600}
              className="w-full aspect-square object-cover rounded-2xl"
              unoptimized
            />
          ) : (
            <div className="w-full aspect-square bg-surface-secondary rounded-2xl" />
          )}
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">{item.name}</h1>
          <p className="font-heading text-2xl text-accent font-semibold mb-4">
            ${(item.price / 100).toFixed(2)}
          </p>
          <p className="text-muted mb-6">{item.description}</p>

          {isClosed ? (
            <div className="bg-surface-secondary rounded-lg p-4 text-center">
              <p className="font-medium text-muted">This item is currently unavailable</p>
            </div>
          ) : !user ? (
            <div>
              <Link
                href={`/auth/login?returnUrl=/merch/${slug}`}
                className="bg-accent text-accent-foreground rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity w-full block text-center"
              >
                Sign in to Purchase
              </Link>
              <p className="text-xs text-muted text-center mt-2">An account is required to complete purchases</p>
            </div>
          ) : (
            <div>
              {pickupLocations.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Pickup Location</label>
                  <select className="w-full rounded-lg border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none">
                    <option value="">Select a pickup location</option>
                    {pickupLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name} - {loc.address}</option>
                    ))}
                  </select>
                </div>
              )}
              <button className="bg-accent text-accent-foreground rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity w-full">
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
