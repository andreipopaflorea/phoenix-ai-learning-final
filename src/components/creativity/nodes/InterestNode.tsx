import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface InterestData {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
}

const InterestNode = memo(({ data }: NodeProps<InterestData>) => {
  const nodeColor = data.color || "#8B5CF6";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}
      className="group relative"
    >
      {/* Soft glow */}
      <div 
        className="absolute inset-0 rounded-[20px] opacity-15 blur-lg scale-110 transition-opacity group-hover:opacity-30"
        style={{ backgroundColor: nodeColor }}
      />
      
      {/* Organic shape container */}
      <div 
        className="relative min-w-[130px] max-w-[160px] rounded-[20px] bg-card border-2 border-dashed shadow-md cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:scale-105"
        style={{ borderColor: nodeColor }}
      >
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-full"
              style={{ backgroundColor: `${nodeColor}20` }}
            >
              <Lightbulb 
                className="w-4 h-4"
                style={{ color: nodeColor }}
              />
            </div>
            <span 
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: nodeColor }}
            >
              Interest
            </span>
          </div>
          
          <h3 className="font-medium text-sm text-foreground leading-tight line-clamp-2">
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
        position={Position.Top}
        className="!w-3 !h-3 !bg-card !border-2"
        style={{ borderColor: nodeColor }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-card !border-2"
        style={{ borderColor: nodeColor }}
      />
    </motion.div>
  );
});

InterestNode.displayName = "InterestNode";

export default InterestNode;
