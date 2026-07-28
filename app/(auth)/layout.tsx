import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="https://cdn.cms.corefutures.co/auth-video.webm"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.35_0.15_285)] via-[oklch(0.35_0.15_285)]/60 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end h-full p-10 text-white">
          <Link href="/" className="absolute top-10 left-10 font-heading font-bold text-xl">Royalhouse</Link>
          <div>
            <p className="font-heading text-4xl font-semibold leading-tight mb-3">
              Where faith<br />meets fellowship.
            </p>
             <p className="text-white/70 text-sm">Royalhouse Chapel International</p>
            <p className="text-white/40 text-xs mt-1">Conference Booking Platform</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}
