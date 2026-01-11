import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { FileText, Link2, Sparkles } from "lucide-react";

interface InspirationData {
  id: string;
  title: string;
  description: string | null;
  hidden_insight: string | null;
  connected_goal_id: string | null;
  insight_strength: number | null;
}

const InspirationNode = memo(({ data }: NodeProps<InspirationData>) => {
  const hasInsight = !!data.hidden_insight;
  const strength = data.insight_strength || 0;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 250, damping: 20, delay: 0.2 }}
      className="group relative"
    >
      {/* Insight glow effect for strong connections */}
      {hasInsight && strength >= 7 && (
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-xl bg-gradient-primary blur-xl"
        />
      )}
      
      {/* Node card */}
      <div className="relative min-w-[120px] max-w-[150px] rounded-xl bg-card border border-border shadow-md cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
        {/* Connection indicator */}
        {data.connected_goal_id && (
          <div className="absolute top-2 right-2">
            <Link2 className="w-3 h-3 text-primary" />
          </div>
        )}
        
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent/10">
              <FileText className="w-4 h-4 text-accent" />
            </div>
            {hasInsight && (
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            )}
          </div>
          
          <h3 className="font-medium text-xs text-foreground leading-tight line-clamp-2">
            {data.title}
          </h3>
          
          {hasInsight && (
            <div className="pt-1 border-t border-border/50">
              <p className="text-[10px] text-primary font-medium line-clamp-2">
                💡 {data.hidden_insight}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-accent !border-2 !border-card"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-accent !border-2 !border-card"
      />
    </motion.div>
  );
});

InspirationNode.displayName = "InspirationNode";

export default InspirationNode;
