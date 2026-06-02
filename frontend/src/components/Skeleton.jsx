// Reusable skeleton components for loading states.
// All use Tailwind's animate-pulse with amber tones to match the app palette.

function Bar({ className = "" }) {
  return <div className={`bg-amber-200 rounded animate-pulse ${className}`} />;
}

// Mimics a single gym/climb card row
export function CardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-xl border border-amber-200 bg-amber-50 mb-3">
      <div className="w-2 shrink-0 bg-amber-200 animate-pulse" />
      <div className="flex-1 px-4 py-3 flex flex-col gap-2">
        <Bar className="h-4 w-2/3" />
        <Bar className="h-3 w-1/3" />
        <div className="flex gap-2 mt-1">
          <Bar className="h-5 w-14 rounded-full" />
          <Bar className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Full-page skeleton — replaces the centred "Loading..." screen on every page.
// Shows a navbar outline + title block + a few card skeletons so the page
// structure is recognisable while data loads rather than being totally blank.
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-orange-50 font-serif">
      {/* navbar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-amber-200 bg-orange-50">
        <Bar className="h-5 w-28" />
        <div className="flex items-center gap-3">
          <Bar className="h-9 w-9 rounded-full" />
          <Bar className="h-4 w-14" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Bar className="h-8 w-56 mb-3" />
        <Bar className="h-4 w-36 mb-8" />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
