import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User as UserIcon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

interface AskMAITabProps {
  entityId: string;
  entityName: string;
  entityCategory: string;
}

export const AskMAITab = ({ entityId, entityName, entityCategory }: AskMAITabProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Category-specific suggested questions
  const getSuggestedQuestions = () => {
    const baseQuestions = [
      `Is ${entityName} trustworthy?`,
      `What are the red flags?`,
    ];

    const categoryQuestions: Record<string, string[]> = {
      "Person": [
        `What's ${entityName}'s professional background?`,
        `Any controversies involving ${entityName}?`,
      ],
      "Company": [
        `Is ${entityName} financially stable?`,
        `What do employees say about ${entityName}?`,
      ],
      "Restaurant": [
        `How's the food quality at ${entityName}?`,
        `Is ${entityName} worth the price?`,
      ],
      "Product": [
        `Is ${entityName} worth buying?`,
        `What are common issues with ${entityName}?`,
      ],
      "Website": [
        `Is ${entityName} a scam website?`,
        `Is it safe to shop on ${entityName}?`,
      ],
      "Crypto": [
        `Is ${entityName} a rug pull risk?`,
        `What's the community sentiment on ${entityName}?`,
      ],
      "Influencer": [
        `Does ${entityName} promote scams?`,
        `Is ${entityName}'s audience real or bots?`,
      ],
      "Movie": [
        `Is ${entityName} worth watching?`,
        `What do critics think of ${entityName}?`,
      ],
      "Place": [
        `Is ${entityName} safe to visit?`,
        `What are must-see spots in ${entityName}?`,
      ],
      "App": [
        `Is ${entityName} safe to download?`,
        `Does ${entityName} have privacy issues?`,
      ],
      "Service": [
        `Is ${entityName} reliable?`,
        `What's the customer support like at ${entityName}?`,
      ],
    };

    return [...baseQuestions, ...(categoryQuestions[entityCategory] || [
      `What do people say about ${entityName}?`,
      `Compare ${entityName} to alternatives`,
    ])];
  };

  const suggestedQuestions = getSuggestedQuestions();

  useEffect(() => {
    fetchConversations();
  }, [entityId]);

  const fetchConversations = async () => {
    setIsLoading(true);
    
    const { data } = await supabase
      .from("mai_conversations")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: true })
      .limit(20);

    if (data) {
      setConversations(data);
    }
    
    setIsLoading(false);
  };

  const askMAI = async (q: string) => {
    if (!q.trim() || isAsking) return;

    setIsAsking(true);
    setQuestion("");

    // Optimistically add the question
    const tempId = `temp-${Date.now()}`;
    setConversations(prev => [...prev, {
      id: tempId,
      question: q,
      answer: "...",
      created_at: new Date().toISOString(),
    }]);

    try {
      const { data, error } = await supabase.functions.invoke("ask-mai", {
        body: { 
          entityId,
          entityName,
          entityCategory,
          question: q,
        },
      });

      if (error) throw error;

      // Update with real answer
      setConversations(prev => 
        prev.map(c => c.id === tempId ? { ...c, id: data.id, answer: data.answer } : c)
      );

      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error asking MAI:", error);
      toast({
        title: "Error",
        description: "Could not get an answer. Please try again.",
        variant: "destructive",
      });
      // Remove failed question
      setConversations(prev => prev.filter(c => c.id !== tempId));
    }

    setIsAsking(false);
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <GlassCard variant="glow" className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neon-gradient flex items-center justify-center">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-2">Ask MAI</h3>
        <p className="text-muted-foreground text-sm">
          Get instant AI-powered insights about {entityName}
        </p>
      </GlassCard>

      {/* Suggested Questions */}
      {conversations.length === 0 && !isLoading && (
        <div className="grid grid-cols-2 gap-2">
          {suggestedQuestions.map((q, i) => (
            <motion.button
              key={i}
              onClick={() => askMAI(q)}
              className="p-3 text-left text-sm glass-card border-white/10 hover:border-primary/30 transition-colors rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              disabled={isAsking}
            >
              <Sparkles className="w-4 h-4 text-primary mb-1" />
              <span className="text-muted-foreground">{q}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Conversation History */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          conversations.map((conv, index) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-3"
            >
              {/* Question */}
              <div className="flex justify-end">
                <div className="max-w-[80%] p-3 rounded-xl bg-primary/20 text-right">
                  <p className="text-sm">{conv.question}</p>
                </div>
              </div>
              
              {/* Answer */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-gradient flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <GlassCard className="p-3">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {conv.answer === "..." ? (
                        <span className="animate-pulse">Thinking...</span>
                      ) : (
                        conv.answer
                      )}
                    </p>
                  </GlassCard>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); askMAI(question); }}>
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask anything about ${entityName}...`}
            className="w-full p-4 pr-12 glass-card border-white/10 focus:border-primary/50 transition-colors rounded-xl"
            disabled={isAsking}
          />
          <button
            type="submit"
            disabled={!question.trim() || isAsking}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
