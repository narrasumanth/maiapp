import { ReactNode, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: ReactNode;
  variant?: "default" | "glow" | "hover";
  className?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, variant = "default", className, ...props }, ref) => {
    const variantClasses = {
      default: "glass-card",
      glow: "glass-card-glow",
      hover: "glass-card-hover",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
