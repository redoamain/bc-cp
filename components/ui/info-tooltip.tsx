// components/ui/info-tooltip.tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  description: string;
  className?: string;
}

export function InfoTooltip({ description, className }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Info
            className={`h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors ${className}`}
          />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-popover text-popover-foreground border shadow-lg p-3">
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
