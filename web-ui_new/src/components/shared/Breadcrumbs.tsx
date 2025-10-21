import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRight, Home } from "lucide-react";
import { useMemo } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
}

// Map route paths to readable labels
const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  "agents": "AI Agents",
  "campaigns": "Campaigns",
  "lead-lists": "Lead Lists",
  "phone-numbers": "Phone Numbers",
  "reporting": "Analytics",
  "settings": "Settings",
  "users": "Users",
  "tenants": "Tenants",
  "trunks": "Trunks",
  "demo-agents": "Demo Agents",
  "system-monitor": "System Monitor",
  "profile": "Profile",
};

export function Breadcrumbs({ items, separator }: BreadcrumbsProps) {
  const router = useRouter();

  const breadcrumbItems = useMemo(() => {
    if (items) return items;

    // Auto-generate breadcrumbs from router path
    const pathSegments = router.pathname
      .split("/")
      .filter((segment) => segment && segment !== "[id]");

    const autoItems: BreadcrumbItem[] = [];
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = ROUTE_LABELS[segment] || segment.replace(/-/g, " ");

      autoItems.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: currentPath,
      });
    });

    // If we have dynamic route params (like id), replace with actual data
    if (router.query.id && autoItems.length > 0) {
      const lastItem = autoItems[autoItems.length - 1];
      lastItem.label = `${lastItem.label} Details`;
    }

    return autoItems;
  }, [items, router.pathname, router.query]);

  const defaultSeparator = separator || <ChevronRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />;

  return (
    <nav className="flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
      {/* Home */}
      <Link
        href="/"
        className="flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
      >
        <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
      </Link>

      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <div key={item.href} className="flex items-center space-x-1">
            <span className="text-gray-400 dark:text-gray-500">{defaultSeparator}</span>
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-gray-100 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
