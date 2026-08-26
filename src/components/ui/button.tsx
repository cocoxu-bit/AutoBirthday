"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

const variants: Record<string, string> = {
  default: "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20",
  secondary: "bg-violet-100 text-violet-900 hover:bg-violet-200",
  destructive: "bg-red-600 hover:bg-red-700 text-white",
  outline:
    "border border-violet-300 bg-transparent hover:bg-violet-50 text-violet-700",
  ghost: "hover:bg-violet-100 text-violet-700",
  link: "text-violet-600 underline-offset-4 hover:underline",
};

const sizes: Record<string, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  lg: "h-12 px-6 text-lg",
  icon: "h-10 w-10",
};

function Button({
  className,
  variant = "default",
  size = "default",
  isLoading = false,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      ref={ref}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
Button.displayName = "Button";

export { Button };
