import { motion } from "framer-motion";
import { CheckCircle, Shield, AlertCircle } from "lucide-react";

interface VerificationBadgeProps {
  isVerified: boolean;
  isClaimed: boolean;
  size?: "sm" | "md" | "lg";
}

export const VerificationBadge = ({ isVerified, isClaimed, size = "md" }: VerificationBadgeProps) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (isVerified || isClaimed) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center ${sizeClasses[size]} rounded-full bg-primary/20 border border-primary/30 text-primary font-medium`}
      >
        <Shield className={iconSizes[size]} />
        <span>Claimed</span>
      </motion.div>
    );
  }


  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center ${sizeClasses[size]} rounded-full bg-muted/50 border border-white/10 text-muted-foreground font-medium`}
    >
      <AlertCircle className={iconSizes[size]} />
      <span>Unclaimed</span>
    </motion.div>
  );
};
