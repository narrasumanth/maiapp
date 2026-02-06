import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Shield, AlertTriangle, Ban, BarChart3, Users, 
  TrendingUp, Clock, CheckCircle, XCircle, Eye,
  Trash2, RefreshCw, Search, Filter, MessageSquare, ShieldAlert
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SearchAnalytics } from "@/components/admin/SearchAnalytics";

interface Dispute {
  id: string;
  title: string;
  dispute_type: string;
  status: string;
  created_at: string;
  user_id: string;
  entity_id: string;
  votes_for_disputer: number;
  votes_against_disputer: number;
  description: string;
  evidence_urls: string[] | null;
}

interface BlockedIP {
  id: string;
  ip_hash: string;
  reason: string;
  blocked_until: string | null;
  is_permanent: boolean;
  created_at: string;
}

interface ApiUsageStats {
  total_requests: number;
  avg_response_time: number;
  success_rate: number;
  top_endpoints: { endpoint: string; count: number }[];
}

interface Stats {
  totalUsers: number;
  totalEntities: number;
  totalDisputes: number;
  pendingDisputes: number;
  blockedIPs: number;
  apiRequests: number;
}

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEntities: 0,
    totalDisputes: 0,
    pendingDisputes: 0,
    blockedIPs: 0,
    apiRequests: 0,
  });
  const [apiUsage, setApiUsage] = useState<ApiUsageStats>({
    total_requests: 0,
    avg_response_time: 0,
    success_rate: 0,
    top_endpoints: [],
  });
  const [disputeFilter, setDisputeFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"])
        .single();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setIsCheckingAuth(false);
      loadAllData();
    } catch (error) {
      console.error("Admin access check failed:", error);
      navigate("/");
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadStats(),
      loadDisputes(),
      loadBlockedIPs(),
      loadApiUsage(),
    ]);
    setIsLoading(false);
  };

  const loadStats = async () => {
    const [usersRes, entitiesRes, disputesRes, blockedRes, apiRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("entities").select("id", { count: "exact", head: true }),
      supabase.from("disputes").select("id, status", { count: "exact" }),
      supabase.from("blocked_ips").select("id", { count: "exact", head: true }),
      supabase.from("api_usage_logs").select("id", { count: "exact", head: true }),
    ]);

    const pendingCount = disputesRes.data?.filter(d => d.status === "pending").length || 0;

    setStats({
      totalUsers: usersRes.count || 0,
      totalEntities: entitiesRes.count || 0,
      totalDisputes: disputesRes.count || 0,
      pendingDisputes: pendingCount,
      blockedIPs: blockedRes.count || 0,
      apiRequests: apiRes.count || 0,
    });
  };

  const loadDisputes = async () => {
    let query = supabase
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });

    if (disputeFilter !== "all") {
      query = query.eq("status", disputeFilter);
    }

    const { data } = await query;
    setDisputes(data || []);
  };

  const loadBlockedIPs = async () => {
    const { data } = await supabase
      .from("blocked_ips")
      .select("*")
      .order("created_at", { ascending: false });
    setBlockedIPs(data || []);
  };

  const loadApiUsage = async () => {
    const { data } = await supabase
      .from("api_usage_logs")
      .select("endpoint, response_time_ms, response_code")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (data && data.length > 0) {
      const totalRequests = data.length;
      const avgResponseTime = data.reduce((acc, log) => acc + (log.response_time_ms || 0), 0) / totalRequests;
      const successCount = data.filter(log => log.response_code && log.response_code < 400).length;
      const successRate = (successCount / totalRequests) * 100;

      // Group by endpoint
      const endpointCounts: Record<string, number> = {};
      data.forEach(log => {
        endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
      });
      const topEndpoints = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setApiUsage({
        total_requests: totalRequests,
        avg_response_time: Math.round(avgResponseTime),
        success_rate: Math.round(successRate * 10) / 10,
        top_endpoints: topEndpoints,
      });
    }
  };

  const resolveDispute = async (disputeId: string, winnerIsDisputer: boolean) => {
    try {
      const { error } = await supabase.rpc("resolve_dispute_by_voting", {
        _dispute_id: disputeId,
        _winner_is_disputer: winnerIsDisputer,
      });

      if (error) throw error;

      toast({
        title: "Dispute Resolved",
        description: `Points have been awarded/deducted based on the resolution.`,
      });
      loadDisputes();
      loadStats();
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute.",
        variant: "destructive",
      });
    }
  };

  const unblockIP = async (id: string) => {
    try {
      const { error } = await supabase.from("blocked_ips").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "IP Unblocked", description: "The IP has been removed from the blocklist." });
      loadBlockedIPs();
      loadStats();
    } catch (error) {
      toast({ title: "Error", description: "Failed to unblock IP.", variant: "destructive" });
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via navigate()
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage disputes, blocked IPs, and view analytics</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
            { label: "Entities", value: stats.totalEntities, icon: TrendingUp, color: "text-green-400" },
            { label: "Total Disputes", value: stats.totalDisputes, icon: AlertTriangle, color: "text-yellow-400" },
            { label: "Pending", value: stats.pendingDisputes, icon: Clock, color: "text-orange-400" },
            { label: "Blocked IPs", value: stats.blockedIPs, icon: Ban, color: "text-red-400" },
            { label: "API Requests", value: stats.apiRequests, icon: BarChart3, color: "text-purple-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-secondary/30 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            to="/admin/messages"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="font-medium">Contact Messages</span>
          </Link>
          <Link
            to="/admin/claim-disputes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-score-yellow/10 border border-score-yellow/20 hover:bg-score-yellow/20 transition-colors"
          >
            <ShieldAlert className="w-5 h-5 text-score-yellow" />
            <span className="font-medium">Claim Disputes</span>
          </Link>
        </div>

        <Tabs defaultValue="search-analytics" className="space-y-6">
          <TabsList className="bg-secondary/30 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="search-analytics">
              <Search className="w-4 h-4 mr-2" />
              Search Analytics
            </TabsTrigger>
            <TabsTrigger value="disputes">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Disputes
            </TabsTrigger>
            <TabsTrigger value="blocked-ips">
              <Ban className="w-4 h-4 mr-2" />
              Blocked IPs
            </TabsTrigger>
            <TabsTrigger value="api-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              API Analytics
            </TabsTrigger>
          </TabsList>

          {/* Search Analytics Tab */}
          <TabsContent value="search-analytics">
            <SearchAnalytics />
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes">
            <Card className="bg-secondary/20 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dispute Management</CardTitle>
                    <CardDescription>Review and resolve pending disputes</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={disputeFilter} onValueChange={(v) => { setDisputeFilter(v); }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={loadDisputes}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {dispute.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{dispute.dispute_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-score-green">👍 {dispute.votes_for_disputer}</span>
                            <span className="text-score-red">👎 {dispute.votes_against_disputer}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              dispute.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                              dispute.status === "resolved" ? "bg-green-500/20 text-green-400" :
                              "bg-red-500/20 text-red-400"
                            }
                          >
                            {dispute.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/disputes/${dispute.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {dispute.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-score-green hover:text-score-green"
                                  onClick={() => resolveDispute(dispute.id, true)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-score-red hover:text-score-red"
                                  onClick={() => resolveDispute(dispute.id, false)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {disputes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No disputes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blocked IPs Tab */}
          <TabsContent value="blocked-ips">
            <Card className="bg-secondary/20 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Blocked IP Addresses</CardTitle>
                    <CardDescription>Manage IP blocks for spam/abuse prevention</CardDescription>
                  </div>
                  <Button variant="outline" size="icon" onClick={loadBlockedIPs}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Hash</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Blocked Until</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono text-sm">
                          {ip.ip_hash.slice(0, 16)}...
                        </TableCell>
                        <TableCell>{ip.reason}</TableCell>
                        <TableCell>
                          <Badge variant={ip.is_permanent ? "destructive" : "secondary"}>
                            {ip.is_permanent ? "Permanent" : "Temporary"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ip.blocked_until 
                            ? new Date(ip.blocked_until).toLocaleDateString()
                            : "Never"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-score-red hover:text-score-red"
                            onClick={() => unblockIP(ip.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {blockedIPs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No blocked IPs
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Analytics Tab */}
          <TabsContent value="api-analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-secondary/30 border-white/10">
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Total Requests</div>
                  <div className="text-3xl font-bold">{apiUsage.total_requests.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border-white/10">
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Avg Response Time</div>
                  <div className="text-3xl font-bold">{apiUsage.avg_response_time}ms</div>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border-white/10">
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Success Rate</div>
                  <div className="text-3xl font-bold text-score-green">{apiUsage.success_rate}%</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-secondary/20 border-white/10">
              <CardHeader>
                <CardTitle>Top Endpoints</CardTitle>
                <CardDescription>Most frequently accessed API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiUsage.top_endpoints.map((endpoint, index) => (
                    <div key={endpoint.endpoint} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-mono text-sm">{endpoint.endpoint}</div>
                        <div className="h-2 bg-secondary rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ 
                              width: `${(endpoint.count / (apiUsage.top_endpoints[0]?.count || 1)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {endpoint.count} requests
                      </div>
                    </div>
                  ))}
                  {apiUsage.top_endpoints.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No API usage data yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
