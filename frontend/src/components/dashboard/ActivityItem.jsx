import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

export function ActivityItem({
  icon: Icon,
  title,
  description,
  time,
  user,
  variant = "default",
}) {
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-muted text-muted-foreground",
  };

  // Fallback para quando o Icon não for fornecido
  const IconComponent = Icon || Activity;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200 group">
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          variantStyles[variant]
        )}
      >
        <IconComponent className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{time}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{user}</span>
        </div>
      </div>
    </div>
  );
}

