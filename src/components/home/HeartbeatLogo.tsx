import { motion } from "framer-motion";

interface HeartbeatLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const HeartbeatLogo = ({ size = "md", showText = true }: HeartbeatLogoProps) => {
  const sizeConfig = {
    sm: { icon: 32, text: "text-lg", gap: "gap-2" },
    md: { icon: 40, text: "text-xl", gap: "gap-2.5" },
    lg: { icon: 56, text: "text-3xl", gap: "gap-3" },
  };
  
  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.gap}`}>
      {/* Professional Logo - Clean M with pulse line */}
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          width={config.icon}
          height={config.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Professional teal gradient */}
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(180, 60%, 48%)" />
              <stop offset="100%" stopColor="hsl(180, 70%, 58%)" />
            </linearGradient>
            <linearGradient id="pulseLineGradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="hsl(180, 60%, 48%)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(180, 60%, 48%)" />
              <stop offset="100%" stopColor="hsl(180, 60%, 48%)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Rounded square background */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            fill="url(#logoGradient)"
          />
          
          {/* M Letter - Bold and clean */}
          <path
            d="M12 34V16L18 26L24 14L30 26L36 16V34"
            stroke="hsl(220, 15%, 8%)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Subtle pulse line accent */}
          <motion.path
            d="M6 38 L14 38 L17 35 L20 41 L24 32 L28 41 L31 35 L34 38 L42 38"
            stroke="hsl(220, 15%, 8%)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      {showText && (
        <div className="flex flex-col">
          <span 
            className={`${config.text} font-bold text-primary`}
          >
            MAI Pulse
          </span>
        </div>
      )}
    </div>
  );
};
