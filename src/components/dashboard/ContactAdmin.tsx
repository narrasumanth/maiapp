import { useState, useEffect } from "react";
import { Send, MessageCircle, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ContactMessage {
  id: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

interface ContactAdminProps {
  userId: string;
  userEmail: string;
  userName?: string;
}

export const ContactAdmin = ({ userId, userEmail, userName }: ContactAdminProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMessages();
  }, [userId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, subject, message, status, admin_response, responded_at, created_at")
        .eq("sender_email", userEmail)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        sender_name: userName || "User",
        sender_email: userEmail,
        subject: subject.trim(),
        message: message.trim(),
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });

      setSubject("");
      setMessage("");
      fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      toast({
        title: "Failed to send",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string, hasResponse: boolean) => {
    if (hasResponse) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-score-green/20 text-score-green">
          <CheckCircle2 className="w-3 h-3" />
          Replied
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-500">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Send New Message */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Contact Support</h3>
            <p className="text-sm text-muted-foreground">Send us a message and we'll respond here</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-secondary/30 border-border/50"
              maxLength={100}
            />
          </div>
          <div>
            <Textarea
              placeholder="How can we help you?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-secondary/30 border-border/50 min-h-[120px] resize-none"
              maxLength={2000}
            />
          </div>
          <Button 
            type="submit" 
            disabled={isSending || !subject.trim() || !message.trim()}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </GlassCard>

      {/* Message History */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/50">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Your Messages</h3>
            <p className="text-sm text-muted-foreground">View your conversation history</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground/70">Send your first message above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className="p-4 rounded-xl bg-secondary/20 border border-border/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{msg.subject}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  {getStatusBadge(msg.status, !!msg.admin_response)}
                </div>
                
                {/* User's message */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                </div>

                {/* Admin response */}
                {msg.admin_response && (
                  <div className="p-3 rounded-lg bg-score-green/5 border border-score-green/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-score-green" />
                      <span className="text-xs font-medium text-score-green">Admin Response</span>
                      {msg.responded_at && (
                        <span className="text-xs text-muted-foreground">
                          • {format(new Date(msg.responded_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
