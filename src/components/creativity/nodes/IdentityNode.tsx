import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { User } from "lucide-react";

const IdentityNode = memo(({ data }: NodeProps<{ label: string }>) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="relative"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-30 blur-xl scale-150" />
      
      {/* Node content */}
      <div className="relative w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing">
        <div className="absolute inset-1 rounded-full bg-card/10 backdrop-blur-sm" />
        <div className="relative flex flex-col items-center gap-1">
          <User className="w-8 h-8 text-primary-foreground" />
          <span className="text-xs font-semibold text-primary-foreground">
            {data.label}
          </span>
        </div>
      </div>

      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-primary-foreground"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-primary-foreground"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-primary-foreground"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-primary-foreground"
      />
    </motion.div>
  );
});

IdentityNode.displayName = "IdentityNode";

export default IdentityNode;
