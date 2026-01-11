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
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-700/50",
    accent: "text-orange-500 dark:text-orange-300",
  },
  yellow: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-700/50",
    accent: "text-amber-500 dark:text-amber-300",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700/50",
    accent: "text-emerald-500 dark:text-emerald-300",
  },
  blue: {
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-700/50",
    accent: "text-sky-500 dark:text-sky-300",
  },
  pink: {
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-700/50",
    accent: "text-rose-500 dark:text-rose-300",
  },
  purple: {
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-700/50",
    accent: "text-violet-500 dark:text-violet-300",
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
