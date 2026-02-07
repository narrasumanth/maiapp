import { motion } from "framer-motion";
import { Zap, Gift, TrendingUp, Calendar, Vote, Crown, Sparkles, ChevronRight, Globe, Lock, Users, Brain } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const PointsValueInfo = () => {
  const earnMethods = [
    {
      icon: Vote,
      title: "Vote & Earn",
      description: "Earn impulse every time you vote and help shape live audience sentiment.",
      impulse: "+100",
      color: "text-score-green",
      bgColor: "bg-score-green/10",
    },
    {
      icon: Calendar,
      title: "Daily Check-In",
      description: "Show up daily and keep your pulse active.",
      impulse: "+100",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Crown,
      title: "Weekly Jackpot Entry",
      description: "Use impulse to enter the weekly grand jackpot — big moments, real rewards.",
      impulse: "5,000",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: TrendingUp,
      title: "Boost Your Pulse",
      description: "Use impulse to increase visibility, unlock insights, and enhance how your pulse is displayed.",
      impulse: "Soon",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const whyMatters = [
    { icon: TrendingUp, text: "Build your public pulse over time" },
    { icon: Lock, text: "Unlock access to exclusive features" },
    { icon: Gift, text: "Participate in rewards and jackpots" },
    { icon: Globe, text: "Help shape how trust works online" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <GlassCard className="p-8 overflow-hidden relative">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">MAI IMPULSE</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Your signal in the digital trust economy
          </h2>
          
          <p className="text-muted-foreground leading-relaxed">
            MAI Impulse isn't just points you earn — it's <span className="text-foreground font-medium">momentum you build</span>. 
            Every action you take helps shape real-time audience sentiment and strengthens a new, people-powered trust system for the internet.
          </p>
        </div>
      </GlassCard>

      {/* Why It Matters */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Why MAI Impulse Matters</h3>
            <p className="text-sm text-muted-foreground">Participation, credibility, and early influence</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {whyMatters.map((item, index) => (
            <motion.div
              key={item.text}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{item.text}</span>
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center mt-4 italic">
          The more you engage, the stronger your signal becomes.
        </p>
      </GlassCard>

      {/* How You Earn */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">How You Earn MAI Impulse</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {earnMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-5 h-full hover:border-primary/30 transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${method.bgColor} shrink-0`}>
                    <method.icon className={`w-5 h-5 ${method.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-semibold">{method.title}</h4>
                      <span className={`text-sm font-bold ${method.color} px-2.5 py-1 rounded-full ${method.bgColor}`}>
                        {method.impulse}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{method.description}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Weekly Grand Jackpot */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard className="p-6 bg-gradient-to-br from-amber-500/5 via-primary/5 to-purple-500/5 border-amber-500/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30">
                <Gift className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold text-lg">🎉 Weekly Grand Jackpot</h4>
                <p className="text-sm text-muted-foreground">Use 5,000 Impulse to enter • Massive prizes await!</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Community-powered. No shortcuts.</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* The Bigger Picture */}
      <GlassCard className="p-6 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-lg mb-3">🧠 The Bigger Picture</h4>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">
                Earning MAI Impulse isn't just about rewards. It's about being an <span className="text-foreground font-medium">early participant in a new digital trust economy</span> — where real people, not platforms or paid reviews, shape what matters.
              </p>
              <p className="text-foreground font-medium italic">
                You're not just earning. You're helping build what comes next.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default PointsValueInfo;
