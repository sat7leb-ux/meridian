import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, children, ...props }, ref) => {
    const variants = {
      primary: "bg-teal text-white hover:bg-teal-600 shadow-raise",
      secondary: "bg-brass text-white hover:bg-brass/90 shadow-raise",
      outline: "border border-hairline bg-surface hover:border-teal text-ink",
      ghost: "hover:bg-hairline/50 text-ink",
      danger: "bg-stop text-white hover:bg-stop/90",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-field font-medium transition-all duration-150",
          "focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
