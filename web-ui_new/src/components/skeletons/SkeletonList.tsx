/**
 * Skeleton List Component
 * Loading placeholder for list items
 */

interface SkeletonListProps {
  items?: number;
}

export function SkeletonList({ items = 3 }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
