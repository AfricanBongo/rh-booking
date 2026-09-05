import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getConferences, getConference } from "@/lib/data/conferences";
import { getMerchItems } from "@/lib/data/merch";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { PillButton, Badge } from "@/components/ui";
import {
  CurrencyDollarIcon,
  CalendarDotsIcon,
  BedIcon,
  UsersIcon,
  EnvelopeSimpleIcon,
  HouseIcon,
  MapPinIcon,
  ClockCountdownIcon,
  WarningCircleIcon,
  PackageIcon,
  TagIcon,
} from "@phosphor-icons/react/dist/ssr";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const conferences = await getConferences();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, conference_id, room_group_id, total_price, amount_paid, status")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: pendingInvitations } = await supabase
    .from("invitations")
    .select("id")
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  const { data: orders } = await supabase
    .from("merch_orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  let conference = null;
  let roomGroup = null;
  let occupantCount = 0;
  let roommateName: string | null = null;

  if (booking) {
    conference = conferences.find(c => c.id === booking.conference_id) ?? null;
    if (!conference) {
      try {
        conference = await getConference(booking.conference_id);
      } catch { /* noop */ }
    }

    const { data: rg } = await supabase
      .from("room_groups")
      .select("room_type_id, bed_preference, max_occupants")
      .eq("id", booking.room_group_id)
      .single();
    roomGroup = rg;

    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("room_group_id", booking.room_group_id)
      .eq("status", "confirmed");
    occupantCount = count ?? 0;

    const { data: roommateBookings } = await supabase
      .from("bookings")
      .select("user_id")
      .eq("room_group_id", booking.room_group_id)
      .neq("user_id", user.id)
      .limit(1);

    if (roommateBookings && roommateBookings.length > 0) {
      const { data: rmProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", roommateBookings[0].user_id)
        .single();
      roommateName = rmProfile?.full_name ?? null;
    }
  }

  const fullName = profile?.full_name ?? "there";
  const firstName = fullName.split(" ")[0];
  const avatarUrl = getAvatarUrl(fullName);
  const remainingBalance = booking ? booking.total_price - booking.amount_paid : 0;
  const progressPercent = booking ? Math.round((booking.amount_paid / booking.total_price) * 100) : 0;
  const isPaidInFull = booking ? remainingBalance <= 0 : false;

  const daysUntilConference = conference
    ? Math.ceil((new Date(conference.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const daysUntilPaymentDeadline = conference?.paymentDeadline
    ? Math.ceil((new Date(conference.paymentDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const typeLabels: Record<number, string> = {
    1: "Private",
    2: "Shared (2)",
    4: "Shared (4)",
  };

  const activeConference = conferences[0];
  const merchItems = activeConference ? await getMerchItems(activeConference.id) : [];
  const invitationCount = pendingInvitations?.length ?? 0;

  return (
    <main className="w-full px-6 md:px-8 py-8 animate-fade-up">
      <div className="flex items-center gap-4 mb-6">
        <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full" />
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold">Welcome back, {firstName}</h1>
          <p className="text-muted text-sm mt-0.5">Your conference booking at a glance.</p>
        </div>
      </div>

      {booking && conference ? (
        <div className="border border-border bg-surface rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
            <div>
              <h2 className="font-heading text-xl font-semibold">{conference.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon size={14} weight="duotone" />
                  {conference.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDotsIcon size={14} weight="duotone" />
                  {new Date(conference.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" – "}
                  {new Date(conference.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
            {isPaidInFull && (
              <Badge variant="soft" className="bg-success/10 text-success">Paid in Full</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
            <DetailItem icon={<BedIcon size={16} weight="duotone" />} label="Room Type" value={roomGroup ? typeLabels[roomGroup.max_occupants] ?? "Room" : "Room"} />
            <DetailItem icon={<BedIcon size={16} weight="duotone" />} label="Bed" value={roomGroup?.bed_preference === "king" ? "King" : "Double"} />
            <DetailItem icon={<ClockCountdownIcon size={16} weight="duotone" />} label="Days Until" value={daysUntilConference !== null ? (daysUntilConference < 0 ? "Past" : `${daysUntilConference}d`) : "—"} />
            <DetailItem icon={<CurrencyDollarIcon size={16} weight="duotone" />} label="Total" value={`$${(booking.total_price / 100).toFixed(0)}`} />
            {roomGroup?.max_occupants !== 1 && (
              <DetailItem icon={<UsersIcon size={16} weight="duotone" />} label="Occupancy" value={`${occupantCount}/${roomGroup?.max_occupants ?? "?"}`} />
            )}
            {roomGroup?.max_occupants !== 1 && (
              <DetailItem icon={<UsersIcon size={16} weight="duotone" />} label="Roommate" value={roommateName ?? "No roommate yet"} noRoommate={!roommateName} />
            )}
          </div>

          <div className="border-t border-border pt-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">${(booking.amount_paid / 100).toFixed(2)} paid</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-muted">
              <span>${(booking.amount_paid / 100).toFixed(2)}</span>
              <span>${(booking.total_price / 100).toFixed(2)}</span>
            </div>
            {!isPaidInFull && (
              <div className="mt-4">
                <PillButton href="/pay" size="md">
                  <CurrencyDollarIcon size={18} weight="bold" />
                  Make a Payment
                </PillButton>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-border bg-surface rounded-2xl p-12 text-center mb-6">
          <HouseIcon size={56} weight="thin" className="mx-auto text-border mb-4" />
          <h2 className="font-heading text-xl font-semibold mb-2">No Active Booking</h2>
          <p className="text-muted mb-6">Register for a conference and book your room.</p>
          <PillButton href="/dashboard/conferences" size="lg">Browse Conferences</PillButton>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <DeadlinesCard
          daysUntilPaymentDeadline={daysUntilPaymentDeadline}
          daysUntilConference={daysUntilConference}
        />

        <div className="overflow-hidden rounded-2xl border border-border bg-surface md:order-none order-last">
          <div className="flex items-center gap-2 px-5 pt-4 pb-3">
            <EnvelopeSimpleIcon size={20} weight="duotone" className="text-accent" />
            <h3 className="font-heading text-base font-semibold">Invitations</h3>
            {invitationCount > 0 && (
              <Badge variant="soft" className="bg-accent/10 text-accent ml-auto">{invitationCount}</Badge>
            )}
          </div>
          <div className="px-5 pb-4">
            {invitationCount > 0 ? (
              <div>
                <p className="text-sm text-muted mb-4">Someone invited you to share a room. Review and respond.</p>
                <PillButton href="/invitations" variant="outline" size="sm">View Invitations</PillButton>
              </div>
            ) : (
              <p className="text-sm text-muted">No pending invitations</p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface md:order-none order-last">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h3 className="font-heading text-base font-semibold">Recent Orders</h3>
            <Link href="/dashboard/merch/orders" className="text-sm text-accent hover:underline">View All</Link>
          </div>
          <div className="px-5 pb-4">
            {orders && orders.length > 0 ? (
              <ul className="space-y-3">
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h3 className="font-heading text-base font-semibold">Upcoming Conferences</h3>
            <Link href="/dashboard/conferences" className="text-sm text-accent hover:underline">See All</Link>
          </div>
          {conferences.length > 0 ? (
            <div className="relative">
              <div className="flex gap-3 px-5 pb-4 overflow-x-auto">
                {conferences.map((conf) => (
                  <ConferenceScrollCard key={conf.id} conference={conf} />
                ))}
              </div>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface to-transparent" />
            </div>
          ) : (
            <p className="text-sm text-muted px-5 pb-4">No upcoming conferences</p>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h3 className="font-heading text-base font-semibold">Merch</h3>
            <Link href="/dashboard/merch" className="text-sm text-accent hover:underline">See All</Link>
          </div>
          {merchItems.length > 0 ? (
            <div className="relative">
              <div className="flex gap-3 px-5 pb-4 overflow-x-auto">
                {merchItems.slice(0, 10).map((item) => (
                  <MerchScrollCard key={item.id} item={item} />
                ))}
              </div>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface to-transparent" />
            </div>
          ) : (
            <p className="text-sm text-muted px-5 pb-4">No items available</p>
          )}
        </div>
      </div>
    </main>
  );
}

function DetailItem({ icon, label, value, noRoommate }: { icon: React.ReactNode; label: string; value: string; noRoommate?: boolean }): React.ReactElement {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-muted mb-0.5">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-medium">
        {noRoommate ? (
          <Link href="/book" className="text-accent hover:underline">{value}</Link>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function DeadlinesCard({ daysUntilPaymentDeadline, daysUntilConference }: { daysUntilPaymentDeadline: number | null; daysUntilConference: number | null }): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="px-5 pt-4 pb-3">
        <h3 className="font-heading text-base font-semibold">Deadlines</h3>
      </div>
      <div className="px-5 pb-4">
        {daysUntilPaymentDeadline !== null || daysUntilConference !== null ? (
          <ul className="space-y-3">
            {daysUntilPaymentDeadline !== null && (
              <li className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  <WarningCircleIcon size={16} weight="duotone" className="text-warning" />
                  Payment Deadline
                </span>
                <Badge variant="soft" className={daysUntilPaymentDeadline <= 7 ? "bg-warning/10 text-warning" : ""}>
                  {daysUntilPaymentDeadline <= 0 ? "Passed" : `${daysUntilPaymentDeadline}d`}
                </Badge>
              </li>
            )}
            {daysUntilConference !== null && (
              <li className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  <ClockCountdownIcon size={16} weight="duotone" className="text-accent" />
                  Conference Starts
                </span>
                <Badge variant="soft">
                  {daysUntilConference <= 0 ? "Started" : `${daysUntilConference}d`}
                </Badge>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted">No upcoming deadlines</p>
        )}
      </div>
    </div>
  );
}

function ConferenceScrollCard({ conference }: { conference: { id: string; slug: string; name: string; startDate: string; endDate: string; imageUrl: string | null; imageFormats: { small: string | null }; isActive: boolean } }): React.ReactElement {
  return (
    <Link href={`/dashboard/conferences/${conference.slug}`} className="shrink-0 w-[200px] group">
      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-surface-secondary mb-2">
        {conference.imageUrl ? (
          <Image src={conference.imageFormats.small ?? conference.imageUrl} alt={conference.name} width={200} height={125} className="w-full h-full object-cover group-hover:scale-105 transition-transform" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDotsIcon size={32} weight="duotone" className="text-muted" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate">{conference.name}</p>
      <p className="text-xs text-muted">
        {new Date(conference.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        {" – "}
        {new Date(conference.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
      {conference.isActive && <Badge variant="soft" className="bg-success/10 text-success text-xs mt-1">Active</Badge>}
    </Link>
  );
}

function MerchScrollCard({ item }: { item: { id: string; slug: string; name: string; price: number; imageUrl: string | null; imageFormats: { small: string | null } } }): React.ReactElement {
  return (
    <Link href={`/dashboard/merch/${item.slug}`} className="shrink-0 w-[160px] group">
      <div className="aspect-square rounded-xl overflow-hidden bg-surface-secondary mb-2">
        {item.imageUrl ? (
          <Image src={item.imageFormats.small ?? item.imageUrl} alt={item.name} width={160} height={160} className="w-full h-full object-cover group-hover:scale-105 transition-transform" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TagIcon size={32} weight="duotone" className="text-muted" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate">{item.name}</p>
      <p className="text-xs text-muted">${(item.price / 100).toFixed(0)}</p>
    </Link>
  );
}

function OrderRow({ order }: { order: { id: string; created_at: string; status: string; total_amount: number } }): React.ReactElement {
  return (
    <li className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <PackageIcon size={16} weight="duotone" className="text-muted flex-shrink-0" />
        <span className="truncate">
          {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <Badge variant="soft" className="text-xs capitalize">{order.status}</Badge>
    </li>
  );
}
