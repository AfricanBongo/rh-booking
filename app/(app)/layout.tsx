import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let fullName = "User";
  let email = user?.email ?? "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    fullName = profile?.full_name ?? email;
  }

  return (
    <>
      <div className="md:hidden">
        <Header />
      </div>

      <Sidebar fullName={fullName} email={email} />

      <div className="app-content min-h-screen">
        <div className="hidden md:block">
          <Topbar />
        </div>
        <main>{children}</main>
      </div>
    </>
  );
}
