import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User, 
  Shield, 
  Eye, 
  Star, 
  MessageCircle, 
  Bell, 
  Settings,
  TrendingUp,
  Users,
  CheckCircle,
  Key,
  FileText,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";

interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  trust_score: number;
  total_reviews: number;
  total_verifications: number;
  email_verified: boolean;
  twitter_verified: boolean;
  linkedin_verified: boolean;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  location: string | null;
}

interface ClaimedEntity {
  id: string;
  name: string;
  category: string;
  is_verified: boolean;
}

interface VisitStats {
  total: number;
  today: number;
  thisWeek: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [claimedEntities, setClaimedEntities] = useState<ClaimedEntity[]>([]);
  const [visitStats, setVisitStats] = useState<VisitStats>({ total: 0, today: 0, thisWeek: 0 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const defaultTab = searchParams.get("tab") || "overview";

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUser(session.user);
      await Promise.all([
        fetchProfile(session.user.id),
        fetchClaimedEntities(session.user.id),
        fetchNotifications(session.user.id),
      ]);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setFirstName(data.first_name || "");
      setMiddleName(data.middle_name || "");
      setLastName(data.last_name || "");
      // Parse phone - extract country code if present
      if (data.phone) {
        const phoneMatch = data.phone.match(/^(\+\d{1,4})\s*(.*)$/);
        if (phoneMatch) {
          setCountryCode(phoneMatch[1]);
          setPhone(phoneMatch[2]);
        } else {
          setPhone(data.phone);
        }
      }
      setCountry(data.country || "");
      setLocation(data.location || "");
    }
  };

  const fetchClaimedEntities = async (userId: string) => {
    const { data: entities } = await supabase
      .from("entities")
      .select("id, name, category, is_verified")
      .eq("claimed_by", userId);

    if (entities) {
      setClaimedEntities(entities);
      
      // Fetch visit stats for all claimed entities
      if (entities.length > 0) {
        const entityIds = entities.map(e => e.id);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const [totalResult, todayResult, weekResult] = await Promise.all([
          supabase
            .from("entity_visits")
            .select("id", { count: "exact", head: true })
            .in("entity_id", entityIds),
          supabase
            .from("entity_visits")
            .select("id", { count: "exact", head: true })
            .in("entity_id", entityIds)
            .gte("visited_at", todayStart.toISOString()),
          supabase
            .from("entity_visits")
            .select("id", { count: "exact", head: true })
            .in("entity_id", entityIds)
            .gte("visited_at", weekStart.toISOString()),
        ]);

        setVisitStats({
          total: totalResult.count || 0,
          today: todayResult.count || 0,
          thisWeek: weekResult.count || 0,
        });
      }
    }
  };

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    const fullPhone = phone ? `${countryCode} ${phone}`.trim() : null;

    const { error } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName || null,
        first_name: firstName || null,
        middle_name: middleName || null,
        last_name: lastName || null,
        phone: fullPhone,
        country: country || null,
        location: location || null,
      })
      .eq("user_id", user.id);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      fetchProfile(user.id);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;

    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    setNotifications([]);
    toast({ title: "Notifications cleared" });
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-score-green";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <PulseWaveBackground />

      <div className="container mx-auto px-4 relative z-10 pt-8">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GlassCard className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-primary" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {profile?.display_name || user?.email?.split("@")[0]}
                </h1>
                <p className="text-muted-foreground mb-3">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className={`font-bold ${getScoreColor(profile?.trust_score || 0)}`}>
                      {profile?.trust_score || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">Pulse</span>
                  </div>
                  {profile?.email_verified && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-score-green/10 border border-score-green/20 text-score-green text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Action */}
              <Link
                to="/flex"
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                View Flex Card
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <GlassCard className="p-4 text-center">
            <Eye className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{visitStats.total}</p>
            <p className="text-sm text-muted-foreground">Total Visits</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-score-green mx-auto mb-2" />
            <p className="text-2xl font-bold">{visitStats.today}</p>
            <p className="text-sm text-muted-foreground">Today</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Star className="w-6 h-6 text-score-yellow mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile?.total_reviews || 0}</p>
            <p className="text-sm text-muted-foreground">Reviews Given</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Users className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold">{claimedEntities.length}</p>
            <p className="text-sm text-muted-foreground">Claimed Profiles</p>
          </GlassCard>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="profiles" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profiles</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-4">Your Pulse Overview</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20">
                    <div>
                      <p className="font-medium">Your Pulse</p>
                      <p className="text-sm text-muted-foreground">Based on your activity</p>
                    </div>
                    <span className={`text-3xl font-bold ${getScoreColor(profile?.trust_score || 0)}`}>
                      {profile?.trust_score || 0}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/20">
                      <p className="text-sm text-muted-foreground mb-1">Weekly Visits</p>
                      <p className="text-xl font-bold">{visitStats.thisWeek}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/20">
                      <p className="text-sm text-muted-foreground mb-1">Verifications</p>
                      <p className="text-xl font-bold">{profile?.total_verifications || 0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/20">
                      <p className="text-sm text-muted-foreground mb-1">Reviews Given</p>
                      <p className="text-xl font-bold">{profile?.total_reviews || 0}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="profiles">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Claimed Profiles</h2>
                  <span className="text-sm text-muted-foreground">
                    {claimedEntities.length} / 4 slots used
                  </span>
                </div>
                {claimedEntities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    You haven't claimed any profiles yet. Search for yourself and claim your profile!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {claimedEntities.map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => {
                          sessionStorage.setItem("mai-entity-id", entity.id);
                          navigate(`/result?q=${encodeURIComponent(entity.name)}`);
                        }}
                      >
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {entity.name}
                            {entity.is_verified && (
                              <CheckCircle className="w-4 h-4 text-score-green" />
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{entity.category}</p>
                        </div>
                        <Eye className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </TabsContent>

            <TabsContent value="notifications">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Notifications</h2>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-sm text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No notifications yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-xl ${
                          notif.is_read ? "bg-secondary/20" : "bg-primary/10 border border-primary/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            {notif.type === "message" && <MessageCircle className="w-4 h-4 text-primary" />}
                            {notif.type === "score_change" && <TrendingUp className="w-4 h-4 text-primary" />}
                            {notif.type === "profile_visit" && <Eye className="w-4 h-4 text-primary" />}
                            {notif.type === "new_follower" && <Users className="w-4 h-4 text-primary" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{notif.title}</p>
                            <p className="text-sm text-muted-foreground">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <GlassCard className="p-6">
                  <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
                  <p className="text-sm text-muted-foreground mb-6">All fields are optional</p>
                  
                  <div className="space-y-6">
                    {/* Real Name Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Real Name</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 transition-colors"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Middle Name</label>
                          <input
                            type="text"
                            value={middleName}
                            onChange={(e) => setMiddleName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 transition-colors"
                            placeholder="Michael"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 transition-colors"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Display Name</h3>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 transition-colors"
                        placeholder="How you want to appear publicly"
                      />
                    </div>

                    {/* Contact Number */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact Number</h3>
                      <div className="flex gap-3">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-28 px-3 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 transition-colors"
                        >
                          <option value="+1">+1 🇺🇸</option>
                          <option value="+44">+44 🇬🇧</option>
                          <option value="+91">+91 🇮🇳</option>
                          <option value="+61">+61 🇦🇺</option>
                          <option value="+49">+49 🇩🇪</option>
                          <option value="+33">+33 🇫🇷</option>
                          <option value="+81">+81 🇯🇵</option>
                          <option value="+86">+86 🇨🇳</option>
                          <option value="+55">+55 🇧🇷</option>
                          <option value="+52">+52 🇲🇽</option>
                          <option value="+971">+971 🇦🇪</option>
                          <option value="+65">+65 🇸🇬</option>
                          <option value="+82">+82 🇰🇷</option>
                          <option value="+39">+39 🇮🇹</option>
                          <option value="+34">+34 🇪🇸</option>
                          <option value="+31">+31 🇳🇱</option>
                          <option value="+46">+46 🇸🇪</option>
                          <option value="+41">+41 🇨🇭</option>
                          <option value="+7">+7 🇷🇺</option>
                          <option value="+27">+27 🇿🇦</option>
                        </select>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                          className="flex-1 px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 transition-colors"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>

                    {/* Location Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Country</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 transition-colors"
                            placeholder="United States"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">City / Region</label>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 transition-colors"
                            placeholder="New York, NY"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={updateProfile}
                      disabled={isSaving}
                      className="btn-neon px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </GlassCard>

                {/* Developer Tools */}
                <GlassCard className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    Developer Tools
                  </h2>
                  <div className="space-y-3">
                    <Link
                      to="/api-keys"
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">API Keys</p>
                          <p className="text-sm text-muted-foreground">Manage API access for integrations</p>
                        </div>
                      </div>
                      <span className="text-muted-foreground">→</span>
                    </Link>
                    
                    <div className="p-4 rounded-xl bg-secondary/20">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-accent" />
                        <div>
                          <p className="font-medium">API Documentation</p>
                          <p className="text-sm text-muted-foreground">
                            Endpoints: <code className="text-xs px-1 py-0.5 bg-secondary rounded">/public-api/score/:name</code>, 
                            <code className="text-xs px-1 py-0.5 bg-secondary rounded ml-1">/public-api/search?q=</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
