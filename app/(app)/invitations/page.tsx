import { createClient } from "@/lib/supabase/server";
import { getInvitationsForUser } from "@/lib/data/invitations";
import { InvitationsClient } from "./InvitationsClient";
import { redirect } from "next/navigation";

export default async function InvitationsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const invitations = await getInvitationsForUser(user.id);
  const received = invitations.filter((inv) => inv.inviteeId === user.id);

  return (
    <main className="px-6 md:px-8 py-8">
      <div className="max-w-4xl">
        <InvitationsClient invitations={received} />
      </div>
    </main>
  );
}
