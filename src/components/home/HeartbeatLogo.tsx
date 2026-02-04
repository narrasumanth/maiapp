import { motion } from "framer-motion";

interface HeartbeatLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const HeartbeatLogo = ({ size = "md", showText = true }: HeartbeatLogoProps) => {
  const sizeConfig = {
    sm: { icon: 32, text: "text-xl", gap: "gap-2" },
    md: { icon: 44, text: "text-2xl", gap: "gap-3" },
    lg: { icon: 64, text: "text-4xl", gap: "gap-4" },
  };
  
  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.gap}`}>
      {/* Logo Icon - M with EKG spike */}
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background glow */}
          <defs>
            <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(340, 80%, 55%)" />
              <stop offset="50%" stopColor="hsl(280, 70%, 55%)" />
              <stop offset="100%" stopColor="hsl(200, 80%, 55%)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Outer ring with pulse */}
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="url(#pulseGradient)"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            animate={{ 
              r: [28, 30, 28],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* M with EKG spike in center */}
          <motion.path
            d="M16 44 L16 24 L24 36 L32 16 L40 36 L48 24 L48 44"
            stroke="url(#pulseGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Pulse ring animation */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[hsl(340,80%,55%)]"
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      </motion.div>

      {showText && (
        <div className="flex flex-col">
          <span 
            className={`${config.text} font-bold bg-gradient-to-r from-[hsl(340,80%,60%)] via-[hsl(280,70%,60%)] to-[hsl(200,80%,60%)] bg-clip-text text-transparent`}
          >
            MAI Pulse
          </span>
        </div>
      )}
    </div>
  );
};
