export default function ConferenceDetailLoading(): React.ReactElement {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="w-24 h-4 bg-surface-secondary rounded animate-pulse mb-6" />

      <div className="h-64 md:h-96 bg-surface-secondary rounded-2xl animate-pulse" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface rounded-xl p-4 animate-pulse">
            <div className="w-5 h-5 bg-surface-secondary rounded mb-3" />
            <div className="w-24 h-3 bg-surface-secondary rounded mb-2" />
            <div className="w-40 h-4 bg-surface-secondary rounded" />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="w-48 h-6 bg-surface-secondary rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-surface-secondary rounded animate-pulse" />
          ))}
          <div className="h-4 bg-surface-secondary rounded animate-pulse w-3/4" />
        </div>
      </div>

      <div className="mt-8 bg-surface rounded-xl p-6 animate-pulse">
        <div className="w-48 h-6 bg-surface-secondary rounded mb-4" />
        <div className="space-y-4">
          <div className="h-12 bg-surface-secondary rounded-lg" />
          <div className="h-12 bg-surface-secondary rounded-lg" />
          <div className="h-12 bg-surface-secondary rounded-lg" />
        </div>
      </div>
    </main>
  );
}
