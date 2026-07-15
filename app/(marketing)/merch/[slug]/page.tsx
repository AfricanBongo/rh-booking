import Image from "next/image";
import Link from "next/link";
import { getMerchItemBySlug, getPickupLocations } from "@/lib/data/merch";
import { createClient } from "@/lib/supabase/server";
import { PillButton, Badge } from "@/components/ui";
import {LockSimpleIcon, ShoppingBagIcon, ArrowLeftIcon, MapTrifoldIcon} from "@phosphor-icons/react/ssr";

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
        <ShoppingBagIcon size={48} weight="duotone" className="mx-auto text-border mb-4" />
        <h1 className="font-heading text-2xl font-semibold mb-2">Item not found</h1>
        <p className="text-muted mb-6">This item may have been removed.</p>
        <PillButton href="/merch">
          Back to Merch
        </PillButton>
      </div>
    );
  }

  const pickupLocations = await getPickupLocations(item.conferenceId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isClosed = item.merch_status === "closed";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <Link href="/merch" className="text-sm text-muted hover:text-foreground mb-8 inline-flex items-center gap-1.5 transition-colors">
        <ArrowLeftIcon size={16} />
        All Merchandise
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-secondary">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBagIcon size={64} weight="thin" className="text-border" />
            </div>
          )}
          {isClosed && (
            <div className="absolute top-4 left-4">
              <Badge variant="outline" size="sm" className="bg-surface/90 backdrop-blur-sm text-danger border-danger/20">
                Unavailable
              </Badge>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">{item.name}</h1>
          <p className="font-heading text-2xl text-accent font-semibold mb-4">
            ${(item.price / 100).toFixed(0)}
          </p>
          <p className="text-muted leading-relaxed mb-8">{item.description}</p>

          {isClosed ? (
            <div className="border border-border rounded-2xl p-5 text-center">
              <LockSimpleIcon size={24} weight="duotone" className="mx-auto text-muted mb-2" />
              <p className="font-medium text-muted">This item is currently unavailable</p>
            </div>
          ) : !user ? (
            <div>
              <PillButton href={`/auth/login?returnUrl=/merch/${slug}`} size="lg" fullWidth>
                Sign in to Purchase
              </PillButton>
              <p className="text-xs text-muted text-center mt-3">An account is required to complete purchases</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pickupLocations.length > 0 && (
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                    <MapTrifoldIcon size={16} weight="duotone" />
                    Pickup Location
                  </label>
                  <select className="w-full rounded-xl border border-border px-4 py-3.5 text-foreground bg-background focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200">
                    <option value="">Select a pickup location</option>
                    {pickupLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name} - {loc.address}</option>
                    ))}
                  </select>
                </div>
              )}
              <PillButton type="submit" size="lg" fullWidth>
                Purchase
              </PillButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
