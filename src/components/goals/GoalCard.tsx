import { motion } from "framer-motion";
import { Calendar, FileText, CheckCircle2, Circle, Trash2, Edit2 } from "lucide-react";
import { Goal } from "@/hooks/useGoals";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface GoalCardProps {
  goal: Goal;
  onOpen: (goal: Goal) => void;
  onToggleComplete: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const colorStyles: Record<string, { bg: string; border: string; accent: string }> = {
  orange: {
    bg: "bg-orange-100 dark:bg-orange-950/30",
    border: "border-orange-300 dark:border-orange-800",
    accent: "text-orange-600 dark:text-orange-400",
  },
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-950/30",
    border: "border-yellow-300 dark:border-yellow-800",
    accent: "text-yellow-600 dark:text-yellow-400",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-950/30",
    border: "border-green-300 dark:border-green-800",
    accent: "text-green-600 dark:text-green-400",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-950/30",
    border: "border-blue-300 dark:border-blue-800",
    accent: "text-blue-600 dark:text-blue-400",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-950/30",
    border: "border-pink-300 dark:border-pink-800",
    accent: "text-pink-600 dark:text-pink-400",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-950/30",
    border: "border-purple-300 dark:border-purple-800",
    accent: "text-purple-600 dark:text-purple-400",
  },
};

const learningStyleLabels: Record<string, string> = {
  visual: "Visual",
  auditory: "Auditory",
  reading_writing: "Reading/Writing",
  kinesthetic: "Kinesthetic",
};

export const GoalCard = ({ goal, onOpen, onToggleComplete, onDelete }: GoalCardProps) => {
  const colors = colorStyles[goal.color] || colorStyles.orange;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, rotate: 1 }}
      className={`relative p-4 rounded-xl border-2 ${colors.bg} ${colors.border} cursor-pointer shadow-sm hover:shadow-md transition-shadow min-h-[180px] flex flex-col`}
      onClick={() => onOpen(goal)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(goal);
          }}
          className="p-1 -ml-1 hover:bg-black/5 rounded-full transition-colors"
        >
          {goal.is_completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(goal);
            }}
          >
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(goal.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <h3
        className={`font-semibold text-lg mb-2 line-clamp-2 ${
          goal.is_completed ? "line-through text-muted-foreground" : "text-foreground"
        }`}
      >
        {goal.title}
      </h3>

      {/* Description */}
      {goal.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
          {goal.description}
        </p>
      )}

      {/* Spacer when no description */}
      {!goal.description && <div className="flex-1" />}

      {/* Footer */}
      <div className="mt-auto space-y-2">
        {goal.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {formatDistanceToNow(new Date(goal.deadline), { addSuffix: true })}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {goal.learning_style && (
            <span className={`text-xs font-medium ${colors.accent}`}>
              {learningStyleLabels[goal.learning_style]}
            </span>
          )}
          {!goal.learning_style && <span />}
          {(goal.materials_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="w-3.5 h-3.5" />
              <span>{goal.materials_count}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
