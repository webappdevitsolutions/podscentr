import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition duration-300",
        variant === "primary" && "bg-accent text-white shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 hover:bg-violet-700",
        variant === "secondary" && "bg-ink text-white hover:-translate-y-0.5 dark:bg-white dark:text-ink",
        variant === "ghost" && "bg-white/70 text-ink ring-1 ring-black/10 hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/10",
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  children,
  className,
  variant = "primary"
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition duration-300",
        variant === "primary" && "bg-accent text-white shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 hover:bg-violet-700",
        variant === "secondary" && "bg-ink text-white hover:-translate-y-0.5 dark:bg-white dark:text-ink",
        variant === "ghost" && "bg-white/70 text-ink ring-1 ring-black/10 hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/10",
        className
      )}
    >
      {children}
    </Link>
  );
}
