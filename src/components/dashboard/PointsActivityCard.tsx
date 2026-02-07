import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Coins, TrendingUp, Trophy, Star, ArrowUpRight, ArrowDownRight,
  Gift, Shield, Vote, MessageSquare, Eye, Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

interface PointsData {
  points: number;
  total_earned: number;
  total_redeemed: number;
}

interface Transaction {
  id: string;
  amount: number;
  action_type: string;
  created_at: string;
  reference_id: string | null;
}

interface PointsActivityCardProps {
  userId: string;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  profile_claimed: Shield,
  review: Vote,
  event_win: Trophy,
  stake_won: Gift,
  correct_vote: Star,
  dispute_won: Trophy,
  dispute_lost: Vote,
  incorrect_vote: Vote,
  profile_boost: TrendingUp,
  referral: Gift,
  default: Coins,
};

const ACTION_LABELS: Record<string, string> = {
  profile_claimed: "Profile Claimed",
  review: "Review Submitted",
  event_win: "Event Win",
  stake_won: "Stake Won",
  correct_vote: "Correct Vote",
  dispute_won: "Dispute Won",
  dispute_lost: "Dispute Lost",
  incorrect_vote: "Incorrect Vote",
  profile_boost: "Profile Boost",
  referral: "Referral Bonus",
};

export const PointsActivityCard = ({ userId }: PointsActivityCardProps) => {
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPointsData();
  }, [userId]);

  const fetchPointsData = async () => {
    try {
      // Fetch points
      const { data: points } = await supabase
        .from("user_points")
        .select("points, total_earned, total_redeemed")
        .eq("user_id", userId)
        .maybeSingle();

      setPointsData(points || { points: 0, total_earned: 0, total_redeemed: 0 });

      // Fetch recent transactions
      const { data: txns } = await supabase
        .from("points_transactions")
        .select("id, amount, action_type, created_at, reference_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      setTransactions(txns || []);
    } catch (error) {
      console.error("Error fetching points:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (actionType: string) => {
    return ACTION_ICONS[actionType] || ACTION_ICONS.default;
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Points & Activity</h2>
          </div>
          <TabsList className="bg-secondary/30 h-8">
            <TabsTrigger value="overview" className="text-xs px-3 h-7">Overview</TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-3 h-7">History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          {/* Points Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center"
            >
              <Coins className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{pointsData?.points || 0}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl bg-secondary/30 border border-border text-center"
            >
              <TrendingUp className="w-6 h-6 text-score-green mx-auto mb-2" />
              <p className="text-2xl font-bold text-score-green">+{pointsData?.total_earned || 0}</p>
              <p className="text-xs text-muted-foreground">Earned</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-secondary/30 border border-border text-center"
            >
              <Gift className="w-6 h-6 text-score-yellow mx-auto mb-2" />
              <p className="text-2xl font-bold">{pointsData?.total_redeemed || 0}</p>
              <p className="text-xs text-muted-foreground">Used</p>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 rounded-xl bg-secondary/20 border border-border">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Recent Activity
            </h3>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet. Start earning points!
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 3).map((txn) => {
                  const Icon = getIcon(txn.action_type);
                  return (
                    <div key={txn.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${txn.amount >= 0 ? 'bg-score-green/10' : 'bg-score-red/10'}`}>
                          <Icon className={`w-3.5 h-3.5 ${txn.amount >= 0 ? 'text-score-green' : 'text-score-red'}`} />
                        </div>
                        <span className="text-sm">{ACTION_LABELS[txn.action_type] || txn.action_type}</span>
                      </div>
                      <span className={`text-sm font-bold ${txn.amount >= 0 ? 'text-score-green' : 'text-score-red'}`}>
                        {txn.amount >= 0 ? '+' : ''}{txn.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <Coins className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {transactions.map((txn) => {
                const Icon = getIcon(txn.action_type);
                return (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${txn.amount >= 0 ? 'bg-score-green/10' : 'bg-score-red/10'}`}>
                        <Icon className={`w-4 h-4 ${txn.amount >= 0 ? 'text-score-green' : 'text-score-red'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ACTION_LABELS[txn.action_type] || txn.action_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {txn.amount >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-score-green" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-score-red" />
                      )}
                      <span className={`text-sm font-bold ${txn.amount >= 0 ? 'text-score-green' : 'text-score-red'}`}>
                        {txn.amount >= 0 ? '+' : ''}{txn.amount}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
};
