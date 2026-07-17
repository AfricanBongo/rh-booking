import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConferences } from "@/lib/data/conferences";
import { getMerchItems, getMerchItem } from "@/lib/data/merch";
import { PillButton, Badge } from "@/components/ui";
import { ShoppingBag, Package, CalendarDots } from "@phosphor-icons/react/dist/ssr";

interface MerchOrder {
  id: string;
  merch_item_id: string;
  pickup_location_id: string;
  status: "paid" | "pending";
  created_at: string;
}

interface MerchItemCardProps {
  item: {
    id: string;
    slug: string;
    name: string;
    price: number;
    imageUrl: string | null;
    merch_status: "open" | "closed";
  };
}

export function MerchItemCard({ item }: MerchItemCardProps): React.ReactElement {
  const isClosed = item.merch_status === "closed";

  const card = (
    <div
      className={[
        "group border border-border bg-surface rounded-2xl overflow-hidden transition-all duration-200",
        isClosed ? "opacity-50 pointer-events-none" : "hover:border-accent/30",
      ].join(" ")}
    >
      <div className="relative aspect-square bg-surface-secondary">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} weight="thin" className="text-border" />
          </div>
        )}
        {isClosed && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" size="sm">Unavailable</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-foreground truncate">{item.name}</h3>
        <p className="text-sm text-muted mt-1">${(item.price / 100).toFixed(0)}</p>
      </div>
    </div>
  );

  if (isClosed) return card;

  return (
    <Link href={`/dashboard/merch/${item.slug}`}>
      {card}
    </Link>
  );
}

interface OrderRowProps {
  order: MerchOrder;
  itemName: string | null;
  itemImage: string | null;
}

export function OrderRow({ order, itemName, itemImage }: OrderRowProps): React.ReactElement {
  return (
    <div className="border border-border bg-surface rounded-2xl p-3 flex gap-3 items-center">
      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-secondary shrink-0">
        {itemImage ? (
          <Image
            src={itemImage}
            alt={itemName ?? "Item"}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={20} weight="thin" className="text-border" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {itemName ?? "Unknown Item"}
        </p>
        <span className="flex items-center gap-1 text-xs text-muted mt-0.5">
          <CalendarDots size={12} />
          {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <Badge
        variant={order.status === "paid" ? "soft" : "outline"}
        size="sm"
        className={order.status === "paid" ? "bg-success/10 text-success" : ""}
      >
        {order.status === "paid" ? "Paid" : "Pending"}
      </Badge>
    </div>
  );
}

export default async function MerchPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const conferences = await getConferences();
  const activeConference = conferences[0];
  const items = activeConference ? await getMerchItems(activeConference.id) : [];

  const { data: orders } = await supabase
    .from("merch_orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const merchOrders = (orders ?? []) as MerchOrder[];

  const orderDetails = await Promise.all(
    merchOrders.map(async (order) => {
      try {
        const item = await getMerchItem(order.merch_item_id);
        return { order, name: item.name, image: item.imageUrl };
      } catch {
        return { order, name: null, image: null };
      }
    })
  );

  return (
    <main className="max-w-5xl px-6 md:px-8 py-8 animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-semibold">Merch</h1>
        <PillButton href="#orders" variant="outline" size="sm">
          My Orders
        </PillButton>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <Package size={48} weight="thin" className="mx-auto text-border mb-4" />
          <p className="text-muted">No merchandise available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <MerchItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <section id="orders" className="mt-12 pt-8 border-t border-border">
        <h2 className="font-heading text-lg font-semibold mb-4">My Orders</h2>

        {orderDetails.length === 0 ? (
          <p className="text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orderDetails.map(({ order, name, image }) => (
              <OrderRow key={order.id} order={order} itemName={name} itemImage={image} />
            ))}
            {merchOrders.length >= 5 && (
              <Link
                href="/dashboard/merch/orders"
                className="text-sm text-accent hover:underline inline-block mt-2"
              >
                View All Orders
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
