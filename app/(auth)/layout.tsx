import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="min-h-full flex flex-col">
      {children}
    </div>
  );
}
