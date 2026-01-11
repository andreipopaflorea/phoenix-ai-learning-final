import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

interface GoalData {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
}

const GoalNode = memo(({ data }: NodeProps<GoalData>) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
      className="group relative"
    >
      {/* Ambient glow */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-20 blur-lg scale-110 transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: data.color || "hsl(var(--primary))" }}
      />
      
      {/* Node card */}
      <div 
        className="relative min-w-[140px] max-w-[180px] rounded-2xl bg-card border-2 shadow-lg cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
        style={{ borderColor: data.color || "hsl(var(--primary))" }}
      >
        {/* Header bar */}
        <div 
          className="h-1.5 w-full"
          style={{ backgroundColor: data.color || "hsl(var(--primary))" }}
        />
        
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${data.color || "hsl(var(--primary))"}20` }}
            >
              <Target 
                className="w-4 h-4"
                style={{ color: data.color || "hsl(var(--primary))" }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Goal
            </span>
          </div>
          
          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
            {data.title}
          </h3>
          
          {data.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-card !border-2"
        style={{ borderColor: data.color || "hsl(var(--primary))" }}
      />
      <Handle
        type="source"
        position={Position.Top}
        className="!w-3 !h-3 !bg-card !border-2"
        style={{ borderColor: data.color || "hsl(var(--primary))" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!w-3 !h-3 !bg-card !border-2"
        style={{ borderColor: data.color || "hsl(var(--primary))" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-card !border-2"
        style={{ borderColor: data.color || "hsl(var(--primary))" }}
      />
    </motion.div>
  );
});

GoalNode.displayName = "GoalNode";

export default GoalNode;
