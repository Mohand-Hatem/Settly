import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Compass } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl bg-white border border-[rgba(30,42,74,0.10)] shadow-sm max-w-lg mx-auto my-6",
          className
        )
      )}
    >
      <div className="w-14 h-14 rounded-full bg-[#F6EEDE] border border-[#C69749]/30 flex items-center justify-center text-[#AE8033] mb-4 shadow-sm">
        {icon || <Compass className="w-7 h-7" />}
      </div>
      <h4 className="font-serif text-xl sm:text-2xl font-semibold text-[#131D36] tracking-tight mb-2">
        {title}
      </h4>
      <p className="text-sm text-[#4C5878] leading-relaxed max-w-sm mb-6">
        {description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};
