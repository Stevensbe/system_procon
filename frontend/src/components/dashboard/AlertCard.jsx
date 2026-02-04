import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AlertCard({
  type,
  title,
  message,
  action,
  onAction,
}) {
  const config = {
    warning: {
      icon: AlertTriangle,
      borderColor: "border-l-warning",
      iconColor: "text-warning",
      bgColor: "bg-warning/5",
    },
    info: {
      icon: Info,
      borderColor: "border-l-primary",
      iconColor: "text-primary",
      bgColor: "bg-primary/5",
    },
    success: {
      icon: CheckCircle,
      borderColor: "border-l-success",
      iconColor: "text-success",
      bgColor: "bg-success/5",
    },
  };

  const { icon: Icon, borderColor, iconColor, bgColor } = config[type];

  return (
    <Card
      className={cn(
        "border-l-4 overflow-hidden transition-all duration-300",
        borderColor
      )}
    >
      <CardContent className={cn("p-4", bgColor)}>
        <div className="flex items-start gap-3">
          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {title}
            </h4>
            <p className="text-sm text-muted-foreground mb-2">{message}</p>
            {action && onAction && (
              <Button
                variant="link"
                size="sm"
                onClick={onAction}
                className="h-auto p-0 text-primary hover:text-primary/80"
              >
                {action} →
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

