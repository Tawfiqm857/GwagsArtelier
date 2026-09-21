import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MemberBadgeProps {
  className?: string;
  showLabel?: boolean;
}

/** Shown beside the name of an approved Gwagwalada Elite Movement member. */
const MemberBadge = ({ className = "", showLabel = false }: MemberBadgeProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span
        className={`inline-flex items-center gap-1 text-primary ${className}`}
        aria-label="Official GEM Member"
      >
        <BadgeCheck className="h-4 w-4 shrink-0" />
        {showLabel && <span className="text-xs font-semibold">GEM Member</span>}
      </span>
    </TooltipTrigger>
    <TooltipContent>Official GEM Member</TooltipContent>
  </Tooltip>
);

export default MemberBadge;
