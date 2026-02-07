import { motion } from "framer-motion";
import { 
  Zap, Users, Trophy, Radio, Shield, Globe, 
  Sparkles, Target, Heart, Clock,
  CheckCircle2, Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { VisionContactForm } from "@/components/vision/VisionContactForm";
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const VisionPage = () => {
  const navigate = useNavigate();

  const roadmapItems = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Direct Pulse Voting",
      description: "Real users shape the pulse. Sentiment becomes community-driven, accurate, and current.",
      status: "coming",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Claimed Profiles",
      description: "Own your pulse. Track history, receive alerts, and build accountability.",
      status: "live",
    },
    {
      icon: <Radio className="w-6 h-6" />,
      title: "Live Event Pulses",
      description: "QR-based voting at concerts, launches, and gatherings. Real-world sentiment, verified.",
      status: "coming",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "MAI Impulse",
      description: "Earn through participation, not influence. Unlock features, access, and rewards.",
      status: "live",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Universal Pulse",
      description: "One consistent signal for everything—replacing fragmented review platforms.",
      status: "coming",
    },
  ];

  const principles = [
    { icon: <Clock className="w-5 h-5" />, text: "Updates in real time" },
    { icon: <Shield className="w-5 h-5" />, text: "Resists manipulation" },
    { icon: <Trophy className="w-5 h-5" />, text: "Rewards participation" },
    { icon: <Users className="w-5 h-5" />, text: "Reflects the crowd" },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16">
      <PulseWaveBackground />

      <div className="container mx-auto px-4 relative z-10">
        {/* Hero */}
        <motion.div
          className="text-center max-w-4xl mx-auto pt-12 pb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">The Future of Trust</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            <span className="text-foreground">Your Vision,</span>
            <br />
            <span className="neon-text">Our Pulse</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The internet needs a better way to understand trust. We're building it—
            live, participatory, and powered by real people.
          </p>
        </motion.div>

        {/* The Shift */}
        <motion.div
          className="max-w-4xl mx-auto mb-20"
          {...fadeInUp}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">From Reviews to Real-Time</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The internet was built on reviews—static opinions that age quickly, 
                  are easy to manipulate, and rarely reflect how people feel <em>right now</em>.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Instead of asking <span className="text-foreground">"What did someone write years ago?"</span>
                  <br />
                  MAI Pulse answers: <span className="text-primary font-semibold">"How does the crowd feel right now?"</span>
                </p>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                  <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary/30 to-transparent border border-primary/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-black text-primary">PULSE</div>
                      <div className="text-xs text-muted-foreground mt-1">ERA</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Roadmap */}
        <motion.div
          className="max-w-5xl mx-auto mb-20"
          {...fadeInUp}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">What We're Building</h2>
            <p className="text-muted-foreground">A real-time sentiment layer for everything</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmapItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <GlassCard className="p-6 h-full hover:border-primary/40 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        {item.status === "live" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-score-green/20 text-score-green">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Principles */}
        <motion.div
          className="max-w-4xl mx-auto mb-20"
          {...fadeInUp}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Why This Matters</h2>
              <p className="text-muted-foreground">The internet needs a better way to understand trust</p>
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {principles.map((principle, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="text-primary">{principle.icon}</div>
                  <span className="text-sm font-medium text-foreground">{principle.text}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* What We're Not */}
        <motion.div
          className="max-w-3xl mx-auto mb-20"
          {...fadeInUp}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">What MAI Pulse Is <span className="text-muted-foreground">Not</span></h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {["A review site", "A rating agency", "A pay-to-win tool", "An advisory system"].map((item) => (
              <div 
                key={item}
                className="px-4 py-2 rounded-full bg-muted/50 border border-border text-sm text-muted-foreground"
              >
                ✕ {item}
              </div>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground mt-6">
            Pulse reflects audience sentiment—not facts, endorsements, or judgments.
          </p>
        </motion.div>

        {/* The Vision */}
        <motion.div
          className="max-w-4xl mx-auto mb-16"
          {...fadeInUp}
          transition={{ delay: 0.7 }}
        >
          <GlassCard className="p-8 md:p-12 text-center border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-primary/5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The Bigger Vision</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Building the Next Generation<br />
              <span className="neon-text">Trust Layer</span> for the Internet
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              A system where sentiment is live, participation matters, 
              reputation evolves—and the crowd shapes what matters next.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <Target className="w-4 h-4" />
                Check a Pulse
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <Star className="w-4 h-4" />
                Claim Your Profile
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Contact Us */}
        <motion.div
          className="max-w-3xl mx-auto mb-16"
          {...fadeInUp}
          transition={{ delay: 0.8 }}
        >
          <VisionContactForm />
        </motion.div>

        {/* Closing Statement */}
        <motion.div
          className="text-center max-w-2xl mx-auto"
          {...fadeInUp}
          transition={{ delay: 0.9 }}
        >
          <p className="text-xl font-medium text-foreground mb-2">
            This is the end of the reviews era.
          </p>
          <p className="text-2xl font-bold neon-text">
            And the beginning of the Pulse era.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default VisionPage;
