import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButton {
  type: "view" | "edit" | "delete" | "custom";
  label?: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
}

interface ActionButtonGroupProps {
  actions: ActionButton[];
  size?: "sm" | "default" | "lg";
  className?: string;
}

const defaultIcons = {
  view: Eye,
  edit: Edit,
  delete: Trash2,
};

const defaultColors = {
  view: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  edit: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  delete: "bg-red-100 text-red-700 hover:bg-red-200",
  custom: "",
};

export function ActionButtonGroup({
  actions,
  size = "sm",
  className,
}: ActionButtonGroupProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {actions.map((action, index) => {
        const Icon = action.type === "custom"
          ? null
          : defaultIcons[action.type as keyof typeof defaultIcons];

        return (
          <Button
            key={index}
            size={size}
            variant="ghost"
            onClick={action.onClick}
            className={cn(
              "h-8 px-2",
              action.type !== "custom" && defaultColors[action.type],
              action.className
            )}
          >
            {action.icon ? (
              action.icon
            ) : Icon ? (
              <Icon className="h-4 w-4" />
            ) : null}
            {action.label && <span className="ml-1.5">{action.label}</span>}
          </Button>
        );
      })}
    </div>
  );
}
