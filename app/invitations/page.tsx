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
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <InvitationsClient invitations={received} />
      </div>
    </main>
  );
}
