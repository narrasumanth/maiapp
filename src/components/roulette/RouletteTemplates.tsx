import { motion } from "framer-motion";
import { Mic, Utensils, Gift, Users, ArrowRight, Sparkles } from "lucide-react";

interface RouletteTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  emoji: string;
  defaults: {
    winnersCount: number;
    timerSeconds: number;
    minScoreRequirement: number;
  };
}

const TEMPLATES: RouletteTemplate[] = [
  {
    id: "concert",
    name: "Concert Pick",
    description: "Pick who gets the extra ticket",
    icon: Mic,
    emoji: "🎤",
    defaults: {
      winnersCount: 1,
      timerSeconds: 60,
      minScoreRequirement: 0,
    },
  },
  {
    id: "bill",
    name: "Who Pays?",
    description: "Settle the check fairly",
    icon: Utensils,
    emoji: "🍽️",
    defaults: {
      winnersCount: 1,
      timerSeconds: 30,
      minScoreRequirement: 0,
    },
  },
  {
    id: "giveaway",
    name: "Giveaway",
    description: "Random winner selection",
    icon: Gift,
    emoji: "🎁",
    defaults: {
      winnersCount: 1,
      timerSeconds: 120,
      minScoreRequirement: 30,
    },
  },
  {
    id: "team",
    name: "Team Selector",
    description: "Split into fair teams",
    icon: Users,
    emoji: "🎮",
    defaults: {
      winnersCount: 2,
      timerSeconds: 45,
      minScoreRequirement: 0,
    },
  },
];

interface RouletteTemplatesProps {
  onSelectTemplate: (template: RouletteTemplate) => void;
  onCustomCreate: () => void;
}

export const RouletteTemplates = ({ onSelectTemplate, onCustomCreate }: RouletteTemplatesProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Quick Start Templates</h3>
        <p className="text-sm text-muted-foreground">
          Pre-configured setups for common scenarios
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {TEMPLATES.map((template, index) => (
          <motion.button
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectTemplate(template)}
            className="group relative p-5 rounded-2xl bg-secondary/30 border border-white/10 hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
          >
            {/* Emoji badge */}
            <span className="absolute -top-2 -right-2 text-2xl">
              {template.emoji}
            </span>

            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <template.icon className="w-5 h-5 text-primary" />
            </div>

            <p className="font-semibold mb-1">{template.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {template.description}
            </p>

            <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              One-tap start
              <ArrowRight className="w-3 h-3" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom option */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={onCustomCreate}
        className="w-full p-4 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">Create Custom</span>
      </motion.button>
    </div>
  );
};

export type { RouletteTemplate };
export { TEMPLATES };
