import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export function Topbar(): React.ReactElement {
  return (
    <div className="h-14 border-b border-border bg-surface/90 backdrop-blur-sm px-6 flex items-center sticky top-0 z-30">
      <Breadcrumbs />
    </div>
  );
}
