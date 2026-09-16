import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "portrait" | "interactive";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const baseStyles =
      "bg-white border border-[rgba(30,42,74,0.10)] rounded-xl transition-all duration-200 overflow-hidden";

    const variantStyles = {
      default: "shadow-sm",
      elevated: "shadow-md hover:shadow-lg",
      portrait: "aspect-[4/4.65] flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5",
      interactive: "cursor-pointer hover:border-[rgba(198,151,73,0.4)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
    };

    return (
      <div
        ref={ref}
        className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={twMerge(clsx("p-5 sm:p-6 border-b border-[rgba(30,42,74,0.06)] flex flex-col gap-1.5", className))}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={twMerge(
      clsx(
        "font-serif text-lg sm:text-xl font-semibold text-[#131D36] tracking-tight leading-snug",
        className
      )
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={twMerge(clsx("text-xs sm:text-sm text-[#4C5878] leading-relaxed", className))}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={twMerge(clsx("p-5 sm:p-6", className))} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={twMerge(
      clsx(
        "p-4 sm:p-5 bg-[#F7F6F3]/50 border-t border-[rgba(30,42,74,0.06)] flex items-center justify-between gap-3",
        className
      )
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
