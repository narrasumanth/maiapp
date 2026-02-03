import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlexCard } from "@/components/home/FlexCard";
import { supabase } from "@/integrations/supabase/client";

const FlexPage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{
    name: string;
    score: number;
    avatarUrl?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setUserProfile({
            name: profile.display_name || profile.username || user.email?.split("@")[0] || "Anonymous",
            score: profile.trust_score || 75,
            avatarUrl: profile.avatar_url || undefined,
          });
        } else {
          // Default for logged in user without profile
          setUserProfile({
            name: user.email?.split("@")[0] || "Anonymous",
            score: 75,
          });
        }
      } else {
        // Demo mode for non-logged in users
        setUserProfile({
          name: "Your Name",
          score: 85,
        });
      }
      
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-background opacity-20" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">My Digital Identity</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Your Flex Card
          </h1>
          <p className="text-muted-foreground max-w-md">
            Share your verified digital identity with the world
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <FlexCard
            name={userProfile?.name}
            score={userProfile?.score}
            avatarUrl={userProfile?.avatarUrl}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-muted-foreground">
        <p>MAI Protocol • Trust Intelligence</p>
      </footer>
    </div>
  );
};

export default FlexPage;
