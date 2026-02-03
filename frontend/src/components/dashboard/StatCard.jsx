import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = "default",
}) {
  const variantStyles = {
    default: "bg-primary/5 text-primary",
    success: "bg-success/5 text-success",
    warning: "bg-warning/5 text-warning",
    destructive: "bg-destructive/5 text-destructive",
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", variantStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-success mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive mr-1" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-sm text-muted-foreground ml-1">
              vs mês anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

