import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDiningPassesForConference } from "@/lib/data/dining-passes";
import { DiningPassClient } from "./DiningPassClient";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react/dist/ssr";

interface PageProps {
  params: Promise<{ conferenceId: string }>;
}

export default async function DiningPassPage({ params }: PageProps): Promise<React.ReactElement> {
  const { conferenceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const diningPasses = await getDiningPassesForConference(conferenceId);

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5 mb-4">
        <XIcon size={14} /> Exit
      </Link>
      <div className="max-w-2xl mx-auto">
        <DiningPassClient conferenceId={conferenceId} diningPasses={diningPasses} />
      </div>
    </main>
  );
}
