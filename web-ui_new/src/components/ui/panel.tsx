"use client";

import * as React from "react";
import { ChevronUp, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PanelAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  closeable?: boolean;
  onClose?: () => void;
  actions?: PanelAction[];
  storageKey?: string;
}

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
}

export interface PanelTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface PanelContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const PanelContext = React.createContext<{
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isClosed: boolean;
  close: () => void;
  collapsible: boolean;
  closeable: boolean;
  hasActions: boolean;
}>({
  isCollapsed: false,
  toggleCollapse: () => {},
  isClosed: false,
  close: () => {},
  collapsible: false,
  closeable: false,
  hasActions: false,
});

function Panel({
  className,
  children,
  defaultCollapsed = false,
  collapsible = true,
  closeable = false,
  onClose,
  actions,
  storageKey,
  ...props
}: PanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(`panel-${storageKey}`);
      return saved ? JSON.parse(saved) : defaultCollapsed;
    }
    return defaultCollapsed;
  });

  const [isClosed, setIsClosed] = React.useState(false);

  React.useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(`panel-${storageKey}`, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, storageKey]);

  const toggleCollapse = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const close = React.useCallback(() => {
    setIsClosed(true);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for animation to complete
  }, [onClose]);

  if (isClosed) {
    return null;
  }

  return (
    <PanelContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        isClosed,
        close,
        collapsible,
        closeable,
        hasActions: !!actions && actions.length > 0,
      }}
    >
      <div
        className={cn(
          "x_panel bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mb-4 shadow-sm transition-all duration-300",
          isClosed && "opacity-0 transform scale-95",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </PanelContext.Provider>
  );
}

function PanelHeader({ className, children, icon, ...props }: PanelHeaderProps) {
  const { isCollapsed, toggleCollapse, close, collapsible, closeable, hasActions } =
    React.useContext(PanelContext);

  return (
    <div
      className={cn(
        "x_title border-b-2 border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 text-gray-600 dark:text-gray-400">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>

      {(collapsible || closeable || hasActions) && (
        <ul className="panel_toolbox flex items-center gap-1 ml-auto flex-shrink-0">
          {collapsible && (
            <li>
              <button
                onClick={toggleCollapse}
                className="collapse-link p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label={isCollapsed ? "Expand" : "Collapse"}
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                <ChevronUp
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isCollapsed && "rotate-180"
                  )}
                />
              </button>
            </li>
          )}

          {hasActions && (
            <li>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    aria-label="Settings"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Actions will be passed as children */}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          )}

          {closeable && (
            <li>
              <button
                onClick={close}
                className="close-link p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Close"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function PanelTitle({ className, children, ...props }: PanelTitleProps) {
  return (
    <h2
      className={cn(
        "text-base font-semibold text-gray-900 dark:text-gray-100 m-0 leading-none",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

function PanelSubtitle({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <small
      className={cn(
        "text-xs text-gray-500 dark:text-gray-400 font-normal ml-2",
        className
      )}
      {...props}
    >
      {children}
    </small>
  );
}

function PanelContent({ className, children, ...props }: PanelContentProps) {
  const { isCollapsed } = React.useContext(PanelContext);

  return (
    <div
      className={cn(
        "x_content px-4 py-3 overflow-hidden transition-all duration-300",
        isCollapsed ? "max-h-0 py-0 opacity-0" : "max-h-[10000px] opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Panel, PanelHeader, PanelTitle, PanelSubtitle, PanelContent };
