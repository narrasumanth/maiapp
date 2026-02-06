import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileCaricatureProps {
  entityName: string;
  category: string;
  score: number;
  vibeCheck?: string;
  funFact?: string;
  onImageGenerated?: (url: string) => void;
}

export const ProfileCaricature = ({
  entityName,
  category,
  score,
  vibeCheck,
  funFact,
  onImageGenerated,
}: ProfileCaricatureProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  // Auto-generate on mount
  useEffect(() => {
    generateCaricature();
  }, [entityName]);

  const generateCaricature = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-caricature", {
        body: {
          entityName,
          category,
          score,
          vibeCheck,
          funFact,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        setHasGenerated(true);
        onImageGenerated?.(data.imageUrl);
      } else if (data?.error) {
        toast({
          title: "Generation Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Caricature generation error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to generate caricature",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="glass-card p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">AI Caricature</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
            ✨ Fun
          </span>
        </div>

        <AnimatePresence mode="wait">
          {imageUrl ? (
            <motion.div
              key="image"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10"
            >
              <img
                src={imageUrl}
                alt={`${entityName} caricature`}
                className="w-full h-full object-cover"
              />
              
              {/* Regenerate button */}
              <button
                onClick={generateCaricature}
                disabled={isLoading}
                className="absolute bottom-2 right-2 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="aspect-square rounded-xl bg-gradient-to-br from-secondary/50 to-muted/50 border border-border flex flex-col items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm text-muted-foreground">Creating your caricature...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
                  <button
                    onClick={generateCaricature}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Caricature
                  </button>
                  <p className="text-xs text-muted-foreground text-center px-4">
                    AI-powered fun illustration based on the profile
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-muted-foreground text-center mt-3 italic">
          🎨 For entertainment only — AI-generated art
        </p>
      </div>
    </motion.div>
  );
};
