import { motion } from "framer-motion";

export const PulseWaveBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Clean dark gradient base */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Subtle gradient orbs */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full blur-[150px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, hsl(220, 90%, 56%) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, hsl(260, 60%, 55%) 0%, transparent 70%)' }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(220 15% 20%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(220 15% 20%) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Top fade for navbar */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
    </div>
  );
};
