import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PillButton, Badge } from "@/components/ui";
import { ShoppingBagIcon, ArrowLeftIcon, MapPinIcon, CalendarDotsIcon } from "@phosphor-icons/react/ssr";
import { getMerchItem } from "@/lib/data/merch";

interface MerchOrder {
  id: string;
  merch_item_id: string;
  pickup_location_id: string;
  status: "paid" | "pending";
  created_at: string;
}

export default async function MerchOrdersPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?returnUrl=/merch/orders");

  const { data: orders } = await supabase
    .from("merch_orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const merchOrders = (orders ?? []) as MerchOrder[];

  const itemDetails = await Promise.all(
    merchOrders.map(async (order) => {
      try {
        const item = await getMerchItem(order.merch_item_id);
        return { ...order, item };
      } catch {
        return { ...order, item: null };
      }
    })
  );

  return (
    <main className="max-w-4xl px-6 md:px-8 py-8">
      <Link href="/dashboard/merch" className="text-sm text-muted hover:text-foreground mb-6 inline-flex items-center gap-1.5 transition-colors">
        <ArrowLeftIcon size={16} />
        Back to Merch
      </Link>

      <div className="mb-10">
        <h1 className="font-heading text-2xl md:text-3xl font-semibold">My Orders</h1>
        <p className="text-muted mt-1">Your merchandise purchases and pickup details.</p>
      </div>

      {itemDetails.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBagIcon size={48} weight="thin" className="mx-auto text-border mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">No Orders Yet</h2>
          <p className="text-muted mb-6">Items you purchase will appear here.</p>
          <PillButton href="/dashboard/merch">Browse Merch</PillButton>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {itemDetails.map((order) => (
            <div
              key={order.id}
              className="border border-border bg-surface rounded-2xl p-4 flex gap-4 items-center animate-fade-up"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-secondary shrink-0">
                {order.item?.imageUrl ? (
                  <Image
                    src={order.item.imageUrl}
                    alt={order.item?.name ?? "Item"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBagIcon size={24} weight="thin" className="text-border" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {order.item?.name ?? "Unknown Item"}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <CalendarDotsIcon size={12} />
                    {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {order.item && (
                    <span>${(order.item.price / 100).toFixed(0)}</span>
                  )}
                </div>
              </div>

              <Badge
                variant={order.status === "paid" ? "soft" : "outline"}
                size="sm"
                className={order.status === "paid" ? "bg-success/10 text-success" : ""}
              >
                {order.status === "paid" ? "Paid" : "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
