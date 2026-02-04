import { motion } from "framer-motion";

export const PulseWaveBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(230,30%,5%)] via-[hsl(230,25%,8%)] to-[hsl(230,20%,6%)]" />
      
      {/* Animated mesh gradients */}
      <div className="absolute inset-0 opacity-50">
        <motion.div 
          className="absolute top-1/4 -left-20 w-[800px] h-[800px] rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(circle, hsl(340, 80%, 50%) 0%, transparent 70%)' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 right-0 w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, hsl(280, 70%, 50%) 0%, transparent 70%)' }}
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.25, 0.4, 0.25],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, hsl(200, 80%, 50%) 0%, transparent 70%)' }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* EKG Waveform Lines */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
        {[0, 1, 2].map((index) => (
          <motion.svg
            key={index}
            className="absolute w-[200%] h-32"
            style={{ top: `${30 + index * 20}%` }}
            viewBox="0 0 1200 100"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,50 L100,50 L120,50 L140,20 L160,80 L180,10 L200,90 L220,50 L240,50 L400,50 L420,50 L440,25 L460,75 L480,15 L500,85 L520,50 L540,50 L700,50 L720,50 L740,30 L760,70 L780,20 L800,80 L820,50 L840,50 L1000,50 L1020,50 L1040,35 L1060,65 L1080,25 L1100,75 L1120,50 L1200,50"
              fill="none"
              stroke={index === 1 ? "hsl(340, 80%, 60%)" : "hsl(280, 60%, 50%)"}
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0.3, 0.6, 0.3],
                x: [0, -600, 0]
              }}
              transition={{ 
                pathLength: { duration: 2, ease: "easeInOut" },
                opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                x: { duration: 20 + index * 5, repeat: Infinity, ease: "linear" }
              }}
            />
          </motion.svg>
        ))}
      </div>

      {/* Floating pulse particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: i % 3 === 0 
                ? 'hsl(340, 80%, 60%)' 
                : i % 3 === 1 
                  ? 'hsl(280, 70%, 60%)' 
                  : 'hsl(200, 80%, 60%)',
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />
    </div>
  );
};
