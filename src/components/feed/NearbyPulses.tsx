import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
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

export const NearbyPulses = () => {
  const navigate = useNavigate();
  const [nearby, setNearby] = useState<NearbyPulse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        // Fetch entities with location-related categories
        const { data, error } = await supabase
          .from("entity_scores")
          .select(`
            id,
            score,
            entity_id,
            entities (
              id,
              name,
              category
            )
          `)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching nearby:", error);
          setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Filter to local business categories
          const localCategories = ["Business", "Restaurant", "Cafe", "Retail", "Service", "Food"];
          const localEntities = data.filter(
            (item) => item.entities && localCategories.includes(item.entities.category)
          );

          const nearbyData: NearbyPulse[] = localEntities.slice(0, 4).map((item, index) => ({
            id: item.entity_id,
            name: item.entities?.name || "Unknown",
            category: item.entities?.category || "Business",
            score: item.score,
            distance: `${(0.2 + index * 0.3).toFixed(1)} mi`,
            activeNow: Math.floor(Math.random() * 30) + 5,
            isOpen: Math.random() > 0.3,
          }));

          setNearby(nearbyData);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearby();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-score-green";
    if (score >= 70) return "text-primary";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  const handleClick = (name: string) => {
    navigate(`/?search=${encodeURIComponent(name)}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-20 h-6" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </GlassCard>
    );
  }

  // Empty state
  if (nearby.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <MapPin className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-muted-foreground">Nearby</h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <motion.div
            className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>

          <h3 className="font-medium text-sm mb-1">Discovering your area...</h3>
          <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
            Local pulses will appear as people rate businesses near you.
          </p>
        </motion.div>
      </GlassCard>
    );
  }

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

export default NearbyPulses;
