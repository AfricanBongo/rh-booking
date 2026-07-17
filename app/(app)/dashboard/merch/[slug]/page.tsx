import Image from "next/image";
import Link from "next/link";
import { getMerchItemBySlug, getPickupLocations } from "@/lib/data/merch";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PillButton, Badge } from "@/components/ui";
import { LockSimpleIcon, ShoppingBagIcon, ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { PurchaseForm } from "@/app/(marketing)/merch/[slug]/PurchaseForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DashboardMerchDetailPage({ params }: Props): Promise<React.ReactElement> {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let item;
  try {
    item = await getMerchItemBySlug(slug);
  } catch {
    return (
      <main className="px-6 md:px-8 py-8 text-center">
        <ShoppingBagIcon size={48} weight="duotone" className="mx-auto text-border mb-4" />
        <h1 className="font-heading text-2xl font-semibold mb-2">Item not found</h1>
        <p className="text-muted mb-6">This item may have been removed.</p>
        <PillButton href="/dashboard/merch">Back to Merch</PillButton>
      </main>
    );
  }

  const pickupLocations = await getPickupLocations(item.conferenceId);
  const isClosed = item.merch_status === "closed";

  return (
    <main className="px-6 md:px-8 py-8 animate-fade-up">
      <Link href="/dashboard/merch" className="text-sm text-muted hover:text-foreground mb-8 inline-flex items-center gap-1.5 transition-colors">
        <ArrowLeftIcon size={16} />
        Back to Merch
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6">
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
          ) : (
            <PurchaseForm
              merchItemId={item.id}
              merchItemName={item.name}
              merchItemSlug={item.slug}
              price={item.price}
              pickupLocations={pickupLocations}
            />
          )}
        </div>
      </div>
    </main>
  );
}
