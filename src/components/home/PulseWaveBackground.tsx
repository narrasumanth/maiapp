export const PulseWaveBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Clean dark base */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Subtle teal glow orbs */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full blur-[180px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, hsl(180, 60%, 48%) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, hsl(180, 70%, 55%) 0%, transparent 70%)' }}
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
          backgroundSize: '60px 60px'
        }}
      />

      {/* Top fade for navbar */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
    </div>
  );
};
