import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Scale, ThumbsUp, ThumbsDown, Clock, Users, Award, 
  ExternalLink, FileText, ChevronRight, Trophy, Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Dispute {
  id: string;
  title: string;
  description: string;
  dispute_type: string;
  status: string;
  created_at: string;
  user_id: string;
  entity_id: string;
  votes_for_disputer: number;
  votes_against_disputer: number;
  evidence_urls: string[] | null;
  voting_deadline: string | null;
}

interface UserVote {
  dispute_id: string;
  vote_for_disputer: boolean;
}

interface EntityInfo {
  id: string;
  name: string;
  category: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [entities, setEntities] = useState<Record<string, EntityInfo>>({});
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState({ correct_votes: 0, total_votes: 0, reputation_tier: "newcomer" });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    // Load pending disputes
    const { data: disputesData } = await supabase
      .from("disputes")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setDisputes(disputesData || []);

    // Load entity info for disputes
    if (disputesData && disputesData.length > 0) {
      const entityIds = [...new Set(disputesData.map(d => d.entity_id))];
      const { data: entitiesData } = await supabase
        .from("entities")
        .select("id, name, category")
        .in("id", entityIds);

      const entityMap: Record<string, EntityInfo> = {};
      entitiesData?.forEach(e => { entityMap[e.id] = e; });
      setEntities(entityMap);
    }

    // Load user's votes
    if (user) {
      const { data: votesData } = await supabase
        .from("dispute_votes")
        .select("dispute_id, vote_for_disputer")
        .eq("user_id", user.id);

      const votesMap: Record<string, boolean> = {};
      votesData?.forEach(v => { votesMap[v.dispute_id] = v.vote_for_disputer; });
      setUserVotes(votesMap);

      // Load user stats
      const { data: profileData } = await supabase
        .from("profiles")
        .select("correct_votes, total_votes, reputation_tier")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setUserStats({
          correct_votes: profileData.correct_votes || 0,
          total_votes: profileData.total_votes || 0,
          reputation_tier: profileData.reputation_tier || "newcomer",
        });
      }
    }
  };

  const submitVote = async (disputeId: string, voteForDisputer: boolean) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to vote on disputes.",
        variant: "destructive",
      });
      return;
    }

    setIsVoting(true);
    try {
      const existingVote = userVotes[disputeId];

      if (existingVote !== undefined) {
        // Update existing vote
        const { error } = await supabase
          .from("dispute_votes")
          .update({ vote_for_disputer: voteForDisputer, reasoning: reasoning.trim() || null })
          .eq("dispute_id", disputeId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from("dispute_votes")
          .insert({
            dispute_id: disputeId,
            user_id: user.id,
            vote_for_disputer: voteForDisputer,
            reasoning: reasoning.trim() || null,
          });

        if (error) throw error;

        // Award points for voting
        await supabase.rpc("award_points", {
          _user_id: user.id,
          _amount: 5,
          _action_type: "dispute_vote",
          _reference_id: disputeId,
        });
      }

      toast({
        title: "Vote Recorded",
        description: existingVote !== undefined 
          ? "Your vote has been updated." 
          : "You earned 5 points for voting!",
      });

      setUserVotes(prev => ({ ...prev, [disputeId]: voteForDisputer }));
      setSelectedDispute(null);
      setReasoning("");
      loadData();
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "expert": return "text-yellow-400 bg-yellow-400/20";
      case "trusted": return "text-purple-400 bg-purple-400/20";
      case "contributor": return "text-blue-400 bg-blue-400/20";
      case "member": return "text-green-400 bg-green-400/20";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getVotePercentage = (dispute: Dispute) => {
    const total = dispute.votes_for_disputer + dispute.votes_against_disputer;
    if (total === 0) return 50;
    return (dispute.votes_for_disputer / total) * 100;
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Scale className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">Dispute Resolution</h1>
              </div>
              <p className="text-muted-foreground">
                Vote on disputes to help maintain trust. Correct votes earn points!
              </p>
            </div>
            {user && (
              <Card className="bg-secondary/30 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{userStats.correct_votes}</div>
                      <div className="text-xs text-muted-foreground">Correct Votes</div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {userStats.total_votes > 0 
                          ? Math.round((userStats.correct_votes / userStats.total_votes) * 100) 
                          : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <Badge className={getTierColor(userStats.reputation_tier)}>
                      <Trophy className="w-3 h-3 mr-1" />
                      {userStats.reputation_tier}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Reputation Tiers Explainer */}
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 mb-8">
          <CardContent className="p-4">
            <div className="flex items-center gap-6 overflow-x-auto">
              <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Reputation Tiers:</span>
              </div>
              {[
                { tier: "newcomer", req: "0 votes" },
                { tier: "member", req: "5+ votes" },
                { tier: "contributor", req: "20+ correct, 60%+" },
                { tier: "trusted", req: "50+ correct, 70%+" },
                { tier: "expert", req: "100+ correct, 80%+" },
              ].map((t) => (
                <div key={t.tier} className="flex items-center gap-2 whitespace-nowrap">
                  <Badge className={getTierColor(t.tier)}>{t.tier}</Badge>
                  <span className="text-xs text-muted-foreground">{t.req}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disputes List */}
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const entity = entities[dispute.entity_id];
            const userVote = userVotes[dispute.id];
            const votePercentage = getVotePercentage(dispute);
            const totalVotes = dispute.votes_for_disputer + dispute.votes_against_disputer;

            return (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-secondary/20 border-white/10 hover:border-white/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{dispute.dispute_type}</Badge>
                          {entity && (
                            <span className="text-sm text-muted-foreground">
                              vs {entity.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{dispute.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {dispute.description}
                        </p>

                        {/* Evidence Links */}
                        {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {dispute.evidence_urls.length} evidence link(s)
                            </span>
                            {dispute.evidence_urls.slice(0, 2).map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                Link {i + 1}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Vote Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-score-green">
                              <ThumbsUp className="w-4 h-4" />
                              Support Disputer ({dispute.votes_for_disputer})
                            </span>
                            <span className="flex items-center gap-1 text-score-red">
                              Against ({dispute.votes_against_disputer})
                              <ThumbsDown className="w-4 h-4" />
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                            <div 
                              className="h-full bg-score-green transition-all"
                              style={{ width: `${votePercentage}%` }}
                            />
                            <div 
                              className="h-full bg-score-red transition-all"
                              style={{ width: `${100 - votePercentage}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{Math.round(votePercentage)}%</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {totalVotes} total votes
                            </span>
                            <span>{Math.round(100 - votePercentage)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Vote Buttons */}
                      <div className="flex flex-col gap-2">
                        {userVote !== undefined ? (
                          <div className="text-center">
                            <Badge className={userVote ? "bg-score-green/20 text-score-green" : "bg-score-red/20 text-score-red"}>
                              You voted {userVote ? "Support" : "Against"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              Change Vote
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              className="bg-score-green/20 text-score-green hover:bg-score-green/30 border-score-green/50"
                              variant="outline"
                              onClick={() => {
                                if (!user) {
                                  toast({ title: "Please sign in to vote", variant: "destructive" });
                                  return;
                                }
                                setSelectedDispute(dispute);
                              }}
                            >
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Support
                            </Button>
                            <Button
                              className="bg-score-red/20 text-score-red hover:bg-score-red/30 border-score-red/50"
                              variant="outline"
                              onClick={() => {
                                if (!user) {
                                  toast({ title: "Please sign in to vote", variant: "destructive" });
                                  return;
                                }
                                setSelectedDispute(dispute);
                              }}
                            >
                              <ThumbsDown className="w-4 h-4 mr-2" />
                              Against
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Filed {new Date(dispute.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        +10 pts for correct vote
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {disputes.length === 0 && (
            <Card className="bg-secondary/20 border-white/10">
              <CardContent className="p-12 text-center">
                <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Disputes</h3>
                <p className="text-muted-foreground">
                  All disputes have been resolved. Check back later!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Vote Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background border border-white/10 rounded-2xl p-6 max-w-lg mx-4 w-full"
            >
              <h3 className="text-xl font-bold mb-2">Cast Your Vote</h3>
              <p className="text-sm text-muted-foreground mb-4">
                "{selectedDispute.title}"
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reasoning (optional)
                  </label>
                  <Textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Explain your reasoning based on the evidence..."
                    rows={3}
                    className="bg-secondary/30 border-white/10"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-score-green hover:bg-score-green/80"
                    disabled={isVoting}
                    onClick={() => submitVote(selectedDispute.id, true)}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Support Disputer
                  </Button>
                  <Button
                    className="flex-1 bg-score-red hover:bg-score-red/80"
                    disabled={isVoting}
                    onClick={() => submitVote(selectedDispute.id, false)}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Vote Against
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setSelectedDispute(null);
                    setReasoning("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
