import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export const dynamic = "force-dynamic";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Greeting skeleton */}
      <div>
        <div className="h-3.5 w-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-2" />
        <div className="h-7 w-40 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Latest Check-ins skeleton */}
      <section>
        <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-700 mb-4" />
        <div className="grid grid-cols-2 gap-3 pt-3 px-1">
          <div className="h-36 rounded-3xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-36 rounded-3xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </section>

      {/* History skeleton */}
      <section>
        <div className="h-3 w-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-4" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-14 flex-shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
