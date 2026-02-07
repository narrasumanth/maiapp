import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, User, Mail, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GuestJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (displayName: string, email?: string) => Promise<void>;
  eventTitle: string;
  isLoading: boolean;
}

export const GuestJoinModal = ({ isOpen, onClose, onJoin, eventTitle, isLoading }: GuestJoinModalProps) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }

    // Simple validation - display name should be at least 2 chars
    if (displayName.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    // Optional email validation if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email");
      return;
    }

    await onJoin(displayName.trim(), email.trim() || undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Quick Join
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-primary">{eventTitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Your Name *
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., John D."
                className="mt-2"
                autoFocus
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground mt-1">This will be shown if you win</p>
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email <span className="text-primary font-medium">(recommended)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get winner notifications & use this email to <span className="text-primary">sign in later</span> and claim your points
              </p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Join Now
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            No account needed now. Winners can sign in later with their email to claim points!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
