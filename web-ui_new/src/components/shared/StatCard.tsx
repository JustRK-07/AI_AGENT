import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  iconBgColor = "bg-blue-100 dark:bg-blue-900/20",
  iconColor = "text-blue-600 dark:text-blue-400",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700", className)}>
      <div className="flex flex-col items-center text-center space-y-2">
        <div className={cn("p-3 rounded-lg", iconBgColor)}>
          <div className={cn("h-6 w-6", iconColor)}>{icon}</div>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      </div>
    </Card>
  );
}
