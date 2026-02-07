import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  MessageSquare, Clock, CheckCircle, Mail, User, 
  ArrowRight, Loader2, AlertCircle, XCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const MessagesOverview = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentMessages();
  }, []);

  const fetchRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "responded":
        return (
          <Badge variant="outline" className="bg-score-green/10 text-score-green border-score-green/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Responded
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-muted-foreground/10 text-muted-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingCount = messages.filter(m => m.status === "pending").length;

  return (
    <Card className="bg-secondary/20 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Contact Messages
                {pendingCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                    {pendingCount}
                  </span>
                )}
              </CardTitle>
              <CardDescription>Recent user inquiries and responses</CardDescription>
            </div>
          </div>
          <Link to="/admin/messages">
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <Link
                key={msg.id}
                to="/admin/messages"
                className="block p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-semibold truncate flex-1">{msg.subject}</h4>
                  {getStatusBadge(msg.status)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {msg.message}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {msg.sender_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {msg.sender_email}
                  </span>
                  <span className="text-muted-foreground/60">
                    {format(new Date(msg.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
