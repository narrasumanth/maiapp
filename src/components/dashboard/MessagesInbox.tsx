import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Send, X, User, ArrowLeft, Loader2,
  Inbox, CheckCheck, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  recipient_entity_id: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  entity?: {
    name: string;
  };
}

interface MessagesInboxProps {
  userId: string;
  claimedEntityIds: string[];
}

export const MessagesInbox = ({ userId, claimedEntityIds }: MessagesInboxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (claimedEntityIds.length > 0) {
      fetchMessages();
    } else {
      setIsLoading(false);
    }
  }, [claimedEntityIds]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select(`
          id,
          message,
          sender_id,
          recipient_entity_id,
          is_read,
          created_at
        `)
        .in("recipient_entity_id", claimedEntityIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch sender profiles and entity names
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const entityIds = [...new Set(data.map(m => m.recipient_entity_id))];

        const [profilesRes, entitiesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", senderIds),
          supabase
            .from("entities")
            .select("id, name")
            .in("id", entityIds)
        ]);

        const profileMap = new Map(
          profilesRes.data?.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
        );
        const entityMap = new Map(
          entitiesRes.data?.map(e => [e.id, { name: e.name }])
        );

        const enrichedMessages = data.map(m => ({
          ...m,
          sender_profile: profileMap.get(m.sender_id),
          entity: entityMap.get(m.recipient_entity_id)
        }));

        setMessages(enrichedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("direct_messages")
      .update({ is_read: true })
      .eq("id", messageId);

    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, is_read: true } : m
    ));
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    setIsSending(true);
    try {
      // Create a notification for the original sender
      await supabase.from("notifications").insert({
        user_id: selectedMessage.sender_id,
        type: "message_reply",
        title: "New Reply",
        message: `${selectedMessage.entity?.name || "Profile owner"} replied to your message: "${replyText.slice(0, 50)}${replyText.length > 50 ? '...' : ''}"`,
      });

      toast({
        title: "Reply sent!",
        description: "Your message has been delivered.",
      });

      setReplyText("");
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </GlassCard>
    );
  }

  if (claimedEntityIds.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Messages</h2>
        </div>
        <div className="text-center py-8">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Claim a profile to receive messages
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Messages</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedMessage ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Back Button */}
            <button
              onClick={() => setSelectedMessage(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to inbox
            </button>

            {/* Message Detail */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedMessage.sender_profile?.avatar_url ? (
                    <img 
                      src={selectedMessage.sender_profile.avatar_url} 
                      alt="" 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedMessage.sender_profile?.display_name || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    To: {selectedMessage.entity?.name} • {formatDistanceToNow(new Date(selectedMessage.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{selectedMessage.message}</p>
            </div>

            {/* Reply Box */}
            <div className="space-y-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-24 resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{replyText.length}/500</span>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSending}
                  size="sm"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Messages from visitors will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {messages.map((message) => (
                  <motion.button
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      message.is_read 
                        ? 'bg-secondary/20 border-border hover:border-primary/30' 
                        : 'bg-primary/5 border-primary/20 hover:border-primary/40'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {message.sender_profile?.avatar_url ? (
                          <img 
                            src={message.sender_profile.avatar_url} 
                            alt="" 
                            className="w-full h-full rounded-full object-cover" 
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-medium truncate ${!message.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {message.sender_profile?.display_name || "Anonymous"}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {message.is_read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-score-green" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          To: {message.entity?.name}
                        </p>
                        <p className={`text-sm truncate ${!message.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};
