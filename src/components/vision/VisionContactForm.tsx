import { useState } from "react";
import { Send, Loader2, CheckCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const VisionContactForm = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        sender_name: name.trim(),
        sender_email: email.trim(),
        subject: "Vision Page Inquiry",
        message: message.trim(),
        status: "pending",
      });

      if (error) throw error;

      setIsSent(true);
      toast({
        title: "Message sent!",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });

      // Reset form after delay
      setTimeout(() => {
        setName("");
        setEmail("");
        setMessage("");
        setIsSent(false);
      }, 5000);
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

  if (isSent) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-score-green/20 mb-4">
          <CheckCircle className="w-8 h-8 text-score-green" />
        </div>
        <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
        <p className="text-muted-foreground">
          Thank you for your interest. Our team will review your message and get back to you shortly.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Get in Touch</h3>
          <p className="text-sm text-muted-foreground">Questions? Ideas? We'd love to hear from you</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/30 border-border/50"
              maxLength={100}
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary/30 border-border/50"
              maxLength={255}
            />
          </div>
        </div>
        <div>
          <Textarea
            placeholder="Your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-secondary/30 border-border/50 min-h-[100px] resize-none"
            maxLength={2000}
          />
        </div>
        <Button
          type="submit"
          disabled={isSending || !name.trim() || !email.trim() || !message.trim()}
          className="w-full sm:w-auto"
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
  );
};
