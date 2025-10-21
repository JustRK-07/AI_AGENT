import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface TrendStatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number; // percentage
    isPositive?: boolean; // if undefined, will auto-determine from value
  };
  sparklineData?: Array<{ value: number }>; // Historical data for sparkline
  iconBgColor?: string;
  iconColor?: string;
  valueColor?: string;
  loading?: boolean;
}

export function TrendStatCard({
  icon,
  label,
  value,
  trend,
  sparklineData,
  iconBgColor = "bg-blue-100 dark:bg-blue-900/20",
  iconColor = "text-blue-600 dark:text-blue-400",
  valueColor,
  loading = false,
}: TrendStatCardProps) {
  // Auto-determine if trend is positive based on value if not specified
  const isTrendPositive = trend?.isPositive !== undefined
    ? trend.isPositive
    : (trend?.value ?? 0) >= 0;

  const trendIcon = trend?.value === 0 || !trend ? (
    <Minus className="h-3 w-3" />
  ) : isTrendPositive ? (
    <TrendingUp className="h-3 w-3" />
  ) : (
    <TrendingDown className="h-3 w-3" />
  );

  const trendColorClass = trend?.value === 0 || !trend
    ? "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
    : isTrendPositive
    ? "text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400"
    : "text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400";

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className={`p-3 ${iconBgColor} rounded-lg w-fit mb-3`}>
              <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className={`p-3 ${iconBgColor} rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform duration-200`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <div className="flex items-baseline gap-3">
            <p className={`text-2xl font-bold ${valueColor || 'text-gray-900 dark:text-gray-100'}`}>
              {value}
            </p>
            {trend && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${trendColorClass}`}>
                {trendIcon}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Sparkline Chart */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-24 h-12 ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isTrendPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Comparison Text */}
      {trend && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {isTrendPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last period
        </p>
      )}
    </div>
  );
}
