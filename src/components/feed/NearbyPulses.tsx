import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Users, Star } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface NearbyPulse {
  id: string;
  name: string;
  category: string;
  score: number;
  distance: string;
  activeNow?: number;
  isOpen?: boolean;
}

// Simulated nearby data
const mockNearby: NearbyPulse[] = [
  { id: "1", name: "Burger Spot", category: "Restaurant", score: 92, distance: "0.4 mi", activeNow: 24, isOpen: true },
  { id: "2", name: "Downtown Coffee", category: "Cafe", score: 88, distance: "0.2 mi", activeNow: 12, isOpen: true },
  { id: "3", name: "City Fitness", category: "Gym", score: 76, distance: "0.8 mi", activeNow: 45, isOpen: true },
  { id: "4", name: "Tech Store", category: "Retail", score: 71, distance: "1.2 mi", isOpen: false },
];

export const NearbyPulses = () => {
  const navigate = useNavigate();
  const [nearby, setNearby] = useState<NearbyPulse[]>(mockNearby);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-score-green";
    if (score >= 70) return "text-primary";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  const handleClick = (name: string) => {
    navigate(`/?search=${encodeURIComponent(name)}`);
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Nearby</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Navigation className="w-3.5 h-3.5" />
          <span>Your area</span>
        </div>
      </div>

      <div className="space-y-2">
        {nearby.map((place, index) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleClick(place.name)}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-primary/10"
              )}>
                <span className={cn("text-lg font-bold", getScoreColor(place.score))}>
                  {place.score}
                </span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{place.name}</span>
                  {place.isOpen && (
                    <span className="w-1.5 h-1.5 bg-score-green rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{place.category}</span>
                  <span>•</span>
                  <span>{place.distance}</span>
                </div>
              </div>
            </div>

            {place.activeNow && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{place.activeNow}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {!locationEnabled && (
        <div className="mt-4 p-3 rounded-lg bg-secondary/30 text-center">
          <p className="text-sm text-muted-foreground">
            Enable location to see nearby pulses
          </p>
          <button className="mt-2 text-sm text-primary hover:underline">
            Enable Location
          </button>
        </div>
      )}
    </GlassCard>
  );
};
