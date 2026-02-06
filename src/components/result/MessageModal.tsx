import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  onAuthRequired: () => void;
}

export const MessageModal = ({
  isOpen,
  onClose,
  entityId,
  entityName,
  onAuthRequired,
}: MessageModalProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!message.trim()) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: user.id,
          recipient_entity_id: entityId,
          message: message.trim(),
        });

      if (error) throw error;

      setIsSent(true);
      setMessage("");
      
      toast({
        title: "Message sent!",
        description: `Your message has been delivered to ${entityName}.`,
      });

      setTimeout(() => {
        setIsSent(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="min-h-full flex items-center justify-center p-4">
          <motion.div
            className="relative w-full max-w-md glass-card-glow p-4 sm:p-6 my-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {isSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-score-green/20 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-score-green" />
              </div>
              <h2 className="text-xl font-bold mb-2">Message Sent!</h2>
              <p className="text-muted-foreground">
                Your message has been delivered.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Send Message</h2>
                  <p className="text-sm text-muted-foreground">to {entityName}</p>
                </div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                className="w-full p-4 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 resize-none mb-4"
                rows={5}
                maxLength={1000}
              />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground">
                  {message.length}/1000 characters
                </span>
              </div>

              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="w-full btn-neon py-3 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </>
          )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
