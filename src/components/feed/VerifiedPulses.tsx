import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Clock, Users, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface VerifiedPulse {
  id: string;
  name: string;
  score: number;
  verifiedType: "event" | "location" | "time";
  participants: number;
  badge: string;
}

const verifiedPulses: VerifiedPulse[] = [
  { id: "1", name: "Stadium Concert", score: 94, verifiedType: "event", participants: 12450, badge: "Confirmed Audience" },
  { id: "2", name: "Grand Opening: TechHub", score: 88, verifiedType: "location", participants: 892, badge: "Location Verified" },
  { id: "3", name: "Product Launch Event", score: 91, verifiedType: "time", participants: 3421, badge: "Time-Bound" },
];

export const VerifiedPulses = () => {
  const navigate = useNavigate();

  const getVerifiedIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Users className="w-3.5 h-3.5" />;
      case "location":
        return <MapPin className="w-3.5 h-3.5" />;
      case "time":
        return <Clock className="w-3.5 h-3.5" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5" />;
    }
  };

  const handleClick = (name: string) => {
    navigate(`/?search=${encodeURIComponent(name)}`);
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheck className="w-5 h-5 text-score-green" />
        <h2 className="text-lg font-bold">Confirmed Pulses</h2>
      </div>

      <div className="space-y-3">
        {verifiedPulses.map((pulse, index) => (
          <motion.div
            key={pulse.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleClick(pulse.name)}
            className="p-4 rounded-xl bg-score-green/5 border border-score-green/20 hover:bg-score-green/10 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{pulse.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="flex items-center gap-1 text-xs text-score-green bg-score-green/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    {pulse.badge}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <motion.span
                  className="text-2xl font-black text-score-green"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {pulse.score}
                </motion.span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {getVerifiedIcon(pulse.verifiedType)}
                <span className="capitalize">{pulse.verifiedType}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{pulse.participants.toLocaleString()} confirmed</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => navigate("/feed?view=verified")}
        className="w-full mt-4 py-3 text-sm text-score-green hover:text-score-green/80 flex items-center justify-center gap-2 transition-colors"
      >
        View all confirmed
        <ArrowRight className="w-4 h-4" />
      </button>
    </GlassCard>
  );
};
