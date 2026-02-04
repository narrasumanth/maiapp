import { useMemo } from "react";

interface ScoreBackgroundProps {
  score?: number;
}

/**
 * Dynamic background that shifts gradient color based on entity score
 * - Low scores (0-49): Red-tinted navy
 * - Mid scores (50-74): Yellow-tinted navy
 * - High scores (75-89): Green-tinted navy
 * - Diamond scores (90+): Teal-tinted navy
 */
export const ScoreBackground = ({ score }: ScoreBackgroundProps) => {
  const gradientConfig = useMemo(() => {
    if (score === undefined) {
      // Default teal for no score
      return {
        primary: "hsl(180, 60%, 48%)",
        secondary: "hsl(180, 70%, 55%)",
        opacity: 0.06,
      };
    }

    if (score >= 90) {
      // Diamond - Bright teal/cyan
      return {
        primary: "hsl(180, 70%, 55%)",
        secondary: "hsl(190, 80%, 50%)",
        opacity: 0.08,
      };
    }

    if (score >= 75) {
      // Trustworthy - Green tint
      return {
        primary: "hsl(152, 60%, 45%)",
        secondary: "hsl(160, 65%, 40%)",
        opacity: 0.07,
      };
    }

    if (score >= 50) {
      // Mixed - Yellow/amber tint
      return {
        primary: "hsl(38, 80%, 45%)",
        secondary: "hsl(45, 75%, 40%)",
        opacity: 0.06,
      };
    }

    // High Risk - Red tint
    return {
      primary: "hsl(0, 65%, 45%)",
      secondary: "hsl(10, 60%, 40%)",
      opacity: 0.07,
    };
  }, [score]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Clean dark base */}
      <div className="absolute inset-0 bg-background" />

      {/* Score-tinted gradient orbs */}
      <div className="absolute inset-0 transition-all duration-1000">
        <div
          className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full blur-[180px] transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${gradientConfig.primary} 0%, transparent 70%)`,
            opacity: gradientConfig.opacity,
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${gradientConfig.secondary} 0%, transparent 70%)`,
            opacity: gradientConfig.opacity * 0.7,
          }}
        />
        {/* Additional accent orb for emphasis */}
        <div
          className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full blur-[120px] transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${gradientConfig.primary} 0%, transparent 70%)`,
            opacity: gradientConfig.opacity * 0.5,
          }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(222 20% 20%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(222 20% 20%) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top fade for navbar */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
    </div>
  );
};
