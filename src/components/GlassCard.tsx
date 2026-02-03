import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: "default" | "glow" | "hover";
  className?: string;
}

export const GlassCard = ({ 
  children, 
  variant = "default", 
  className,
  ...props 
}: GlassCardProps) => {
  const variantClasses = {
    default: "glass-card",
    glow: "glass-card-glow",
    hover: "glass-card-hover",
  };

  return (
    <motion.div
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
