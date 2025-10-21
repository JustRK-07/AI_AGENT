/**
 * Skeleton Agent Block Component
 * Loading placeholder for agent cards/blocks
 */

export function SkeletonAgentBlock() {
  return (
    <div className="animate-pulse">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1"></div>
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 bg-white/60 dark:bg-gray-800/60 rounded-md p-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}
