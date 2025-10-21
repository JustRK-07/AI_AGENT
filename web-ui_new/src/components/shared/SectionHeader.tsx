import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
}

export function SectionHeader({
  icon,
  title,
  description,
  iconBgColor = "bg-blue-100 dark:bg-blue-900/20",
  iconColor = "text-blue-600 dark:text-blue-400",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3 mb-4", className)}>
      <div className={cn("p-2 rounded-lg flex-shrink-0", iconBgColor)}>
        <div className={cn("h-5 w-5", iconColor)}>{icon}</div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
