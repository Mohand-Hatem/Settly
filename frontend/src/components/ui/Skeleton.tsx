import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "card";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  const baseStyles =
    "bg-[rgba(30,42,74,0.06)] animate-shimmer relative overflow-hidden";

  const variantStyles = {
    default: "rounded-md",
    circular: "rounded-full",
    card: "rounded-xl",
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={twMerge(
      "bg-white border border-[rgba(30,42,74,0.10)] rounded-xl overflow-hidden shadow-sm flex flex-col p-4 gap-4",
      className
    )}
  >
    <Skeleton className="w-full h-48 rounded-lg" />
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-16 h-4" />
      </div>
      <Skeleton className="w-3/4 h-6" />
      <Skeleton className="w-1/2 h-4" />
    </div>
    <div className="pt-3 border-t border-[rgba(30,42,74,0.06)] flex items-center justify-between">
      <Skeleton className="w-24 h-5" />
      <Skeleton className="w-20 h-8 rounded-lg" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full bg-white border border-[rgba(30,42,74,0.10)] rounded-xl overflow-hidden">
    <div className="p-4 bg-[#F7F6F3]/60 border-b border-[rgba(30,42,74,0.06)] flex gap-4">
      <Skeleton className="w-1/4 h-4" />
      <Skeleton className="w-1/4 h-4" />
      <Skeleton className="w-1/4 h-4" />
      <Skeleton className="w-1/4 h-4" />
    </div>
    <div className="divide-y divide-[rgba(30,42,74,0.06)]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4 items-center">
          <Skeleton className="w-1/4 h-5" />
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>
      ))}
    </div>
  </div>
);
