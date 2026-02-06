import { User, Shield, CheckCircle, Settings } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

interface DashboardHeaderProps {
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    trust_score: number;
    email_verified: boolean;
    phone_verified: boolean;
  } | null;
  email: string;
  onSettingsClick: () => void;
}

export const DashboardHeader = ({ profile, email, onSettingsClick }: DashboardHeaderProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-score-green";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-1 truncate">
            {profile?.display_name || email?.split("@")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mb-2 truncate">{email}</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border text-sm">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className={`font-bold ${getScoreColor(profile?.trust_score || 0)}`}>
                {profile?.trust_score || 0}
              </span>
              <span className="text-muted-foreground">Pulse</span>
            </div>
            {profile?.email_verified && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-score-green/10 border border-score-green/20 text-score-green text-xs">
                <CheckCircle className="w-3 h-3" />
                Email
              </div>
            )}
            {profile?.phone_verified && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-score-green/10 border border-score-green/20 text-score-green text-xs">
                <CheckCircle className="w-3 h-3" />
                Phone
              </div>
            )}
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={onSettingsClick}
          className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-colors"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </GlassCard>
  );
};
