import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnUrl = searchParams.get("returnUrl") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=invalid_link", request.url)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/login?error=invalid_link", request.url)
    );
  }

  return NextResponse.redirect(new URL(returnUrl, request.url));
}
