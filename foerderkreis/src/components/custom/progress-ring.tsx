"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  current,
  target,
  size = 160,
  strokeWidth = 12,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(current / target, 1);
  const offset = circumference * (1 - percentage);

  // Color based on progress
  const getColor = () => {
    if (percentage >= 1) return "stroke-sage-500";
    if (percentage >= 0.7) return "stroke-primary";
    if (percentage >= 0.4) return "stroke-amber-400";
    return "stroke-coral-400";
  };

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700 ease-out", getColor())}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-heading font-extrabold">
          {current.toFixed(1).replace(".", ",")}
        </span>
        <span className="text-sm text-muted-foreground">
          von {target} Std.
        </span>
      </div>
    </div>
  );
}
