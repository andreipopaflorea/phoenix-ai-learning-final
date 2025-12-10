import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Headphones, BookOpen, Hand, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type LearningStyle = "visual" | "auditory" | "reading_writing" | "kinesthetic";

interface LearningStyleSelectorProps {
  currentStyle: LearningStyle | null;
  onSelect: (style: LearningStyle) => void;
  loading?: boolean;
}

const styles = [
  {
    id: "visual" as LearningStyle,
    icon: Eye,
    title: "Visual",
    description: "Learn through diagrams, charts, and imagery",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "auditory" as LearningStyle,
    icon: Headphones,
    title: "Auditory",
    description: "Learn through listening and discussion",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "reading_writing" as LearningStyle,
    icon: BookOpen,
    title: "Reading/Writing",
    description: "Learn through notes and written content",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "kinesthetic" as LearningStyle,
    icon: Hand,
    title: "Kinesthetic",
    description: "Learn through hands-on practice",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export const LearningStyleSelector = ({
  currentStyle,
  onSelect,
  loading,
}: LearningStyleSelectorProps) => {
  const [hoveredStyle, setHoveredStyle] = useState<LearningStyle | null>(null);

  return (
    <div className="grid grid-cols-2 gap-3">
      {styles.map((style) => {
        const isSelected = currentStyle === style.id;
        const isHovered = hoveredStyle === style.id;
        
        return (
          <motion.button
            key={style.id}
            onClick={() => onSelect(style.id)}
            disabled={loading}
            onMouseEnter={() => setHoveredStyle(style.id)}
            onMouseLeave={() => setHoveredStyle(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/30 hover:border-primary/50"
            } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`p-2 rounded-lg ${style.bgColor} w-fit mb-2`}>
              <style.icon className={`w-5 h-5 ${style.color}`} />
            </div>
            <h3 className="font-medium text-sm">{style.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
          </motion.button>
        );
      })}
    </div>
  );
};

export type { LearningStyle };
