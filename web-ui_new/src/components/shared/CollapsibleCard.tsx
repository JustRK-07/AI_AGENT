import * as React from "react";
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelSubtitle,
  PanelContent,
  type PanelAction,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";

export interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  closeable?: boolean;
  onClose?: () => void;
  actions?: PanelAction[];
  storageKey?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  badge?: React.ReactNode;
}

export function CollapsibleCard({
  title,
  subtitle,
  icon,
  children,
  defaultCollapsed = false,
  collapsible = true,
  closeable = false,
  onClose,
  actions,
  storageKey,
  className,
  headerClassName,
  contentClassName,
  badge,
}: CollapsibleCardProps) {
  return (
    <Panel
      defaultCollapsed={defaultCollapsed}
      collapsible={collapsible}
      closeable={closeable}
      onClose={onClose}
      actions={actions}
      storageKey={storageKey}
      className={className}
    >
      <PanelHeader icon={icon} className={cn(headerClassName)}>
        <div className="flex items-center justify-between flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-1 min-w-0">
            <PanelTitle>{title}</PanelTitle>
            {subtitle && <PanelSubtitle>{subtitle}</PanelSubtitle>}
          </div>
          {badge && <div className="ml-auto mr-2">{badge}</div>}
        </div>
      </PanelHeader>
      <PanelContent className={cn(contentClassName)}>{children}</PanelContent>
    </Panel>
  );
}

export default CollapsibleCard;
