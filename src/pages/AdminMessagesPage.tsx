import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Clock, CheckCircle, Send, ArrowLeft, 
  Mail, User, Calendar, Loader2, AlertCircle, XCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { format } from "date-fns";

interface ContactMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

const AdminMessagesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [response, setResponse] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("all");

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"]);

    if (!roles || roles.length === 0) {
      navigate("/");
      toast({
        title: "Access denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      });
      return;
    }

    setIsAdmin(true);
    fetchMessages();
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  };

  const handleRespond = async () => {
    if (!selectedMessage || !response.trim()) return;

    setIsSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("contact_messages")
        .update({
          admin_response: response.trim(),
          status: "responded",
          responded_at: new Date().toISOString(),
          responded_by: user?.id,
        })
        .eq("id", selectedMessage.id);

      if (error) throw error;

      toast({
        title: "Response saved",
        description: "The response has been recorded. Send email manually to the user.",
      });

      setMessages(prev => prev.map(m => 
        m.id === selectedMessage.id 
          ? { ...m, admin_response: response.trim(), status: "responded", responded_at: new Date().toISOString() }
          : m
      ));
      setSelectedMessage(null);
      setResponse("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save response",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkStatus = async (messageId: string, status: string) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", messageId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status } : m
      ));
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === "all") return true;
    if (filter === "pending") return m.status === "pending";
    if (filter === "responded") return m.status === "responded";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "responded":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-score-green/10 text-score-green text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Responded
          </span>
        );
      case "closed":
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted-foreground/10 text-muted-foreground text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <PulseWaveBackground />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 pt-8"
        >
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Contact Messages</h1>
              <p className="text-muted-foreground">Manage and respond to user inquiries</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{messages.length}</p>
            <p className="text-sm text-muted-foreground">Total Messages</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">
              {messages.filter(m => m.status === "pending").length}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-score-green">
              {messages.filter(m => m.status === "responded").length}
            </p>
            <p className="text-sm text-muted-foreground">Responded</p>
          </GlassCard>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-1.5 bg-secondary/30 border border-border/50 rounded-xl mb-6 w-fit">
          {(["all", "pending", "responded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg transition-all font-medium capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Messages List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No messages found</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard 
                  className="p-6 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setSelectedMessage(msg)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold truncate">{msg.subject}</h3>
                        {getStatusBadge(msg.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {msg.sender_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {msg.sender_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Message Detail Modal */}
        <AnimatePresence>
          {selectedMessage && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={() => setSelectedMessage(null)} 
              />

              <motion.div
                className="relative w-full max-w-2xl bg-card border border-border rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
              >
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedMessage.sender_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <a 
                        href={`mailto:${selectedMessage.sender_email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedMessage.sender_email}
                      </a>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Received: {format(new Date(selectedMessage.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Message</h3>
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                {selectedMessage.admin_response ? (
                  <div className="p-4 rounded-xl bg-score-green/10 border border-score-green/20">
                    <h3 className="text-sm font-medium text-score-green mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Your Response
                    </h3>
                    <p className="whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                    {selectedMessage.responded_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Responded: {format(new Date(selectedMessage.responded_at), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Write Response
                    </label>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your response here..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground resize-none mb-4"
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={handleRespond}
                        disabled={!response.trim() || isSending}
                        className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Save Response
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleMarkStatus(selectedMessage.id, "closed")}
                        className="px-6 py-3 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground font-medium transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminMessagesPage;
