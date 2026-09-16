import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CheckCircle2 } from "lucide-react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "published"
    | "pending"
    | "reserved"
    | "sold"
    | "verified"
    | "sage"
    | "navy"
    | "brass"
    | "outline";
  size?: "sm" | "md";
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "sage",
  size = "md",
  showDot = false,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-mono font-medium tracking-tight uppercase select-none transition-colors";

  const variantStyles = {
    published:
      "bg-[#EAF0EC] text-[#3D5A4C] border border-[#3D5A4C]/20",
    pending:
      "bg-[#F6EEDE] text-[#AE8033] border border-[#C69749]/30",
    reserved:
      "bg-[#1E2A4A]/10 text-[#1E2A4A] border border-[#1E2A4A]/20",
    sold:
      "bg-neutral-200 text-neutral-700 border border-neutral-300",
    verified:
      "bg-[#EAF0EC] text-[#3D5A4C] border border-[#3D5A4C]/30 font-semibold",
    sage:
      "bg-[#3D5A4C] text-white border border-[#3D5A4C]",
    navy:
      "bg-[#131D36] text-white border border-[#1E2A4A]",
    brass:
      "bg-[#C69749] text-[#0B111F] border border-[#AE8033] font-semibold",
    outline:
      "bg-transparent text-[#4C5878] border border-[rgba(30,42,74,0.18)]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] rounded-md gap-1",
    md: "px-2.5 py-1 text-xs rounded-lg gap-1.5",
  };

  const dotColor = {
    published: "bg-[#3D5A4C]",
    pending: "bg-[#C69749] animate-pulse",
    reserved: "bg-[#1E2A4A]",
    sold: "bg-neutral-500",
    verified: "bg-[#3D5A4C]",
    sage: "bg-white",
    navy: "bg-[#C69749]",
    brass: "bg-[#0B111F]",
    outline: "bg-[#4C5878]",
  };

  return (
    <span
      className={twMerge(
        clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)
      )}
      {...props}
    >
      {variant === "verified" && (
        <CheckCircle2 className="w-3 h-3 shrink-0 text-[#3D5A4C]" />
      )}
      {showDot && variant !== "verified" && (
        <span
          className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotColor[variant])}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
