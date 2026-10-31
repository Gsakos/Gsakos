import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "glass" | "ghost";
}

export function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary: "btn-primary",
    glass: "btn-glass text-slate-800 dark:text-slate-100",
    ghost: "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
