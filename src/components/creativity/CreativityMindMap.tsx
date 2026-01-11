import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import IdentityNode from "./nodes/IdentityNode";
import GoalNode from "./nodes/GoalNode";
import InterestNode from "./nodes/InterestNode";
import InspirationNode from "./nodes/InspirationNode";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
}

interface Interest {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
}

interface Inspiration {
  id: string;
  title: string;
  description: string | null;
  hidden_insight: string | null;
  connected_goal_id: string | null;
  insight_strength: number | null;
}

interface CreativityMindMapProps {
  goals: Goal[];
  interests: Interest[];
  inspirations: Inspiration[];
}

const nodeTypes = {
  identity: IdentityNode,
  goal: GoalNode,
  interest: InterestNode,
  inspiration: InspirationNode,
};

const CreativityMindMap = ({ goals, interests, inspirations }: CreativityMindMapProps) => {
  // Calculate node positions in a radial layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Center identity node
    nodes.push({
      id: "identity",
      type: "identity",
      position: { x: 400, y: 300 },
      data: { label: "You" },
      draggable: true,
    });

    // Goals in upper arc
    const goalRadius = 250;
    goals.forEach((goal, index) => {
      const angle = Math.PI + (Math.PI * (index + 1)) / (goals.length + 1);
      const x = 400 + goalRadius * Math.cos(angle);
      const y = 300 + goalRadius * Math.sin(angle);

      nodes.push({
        id: `goal-${goal.id}`,
        type: "goal",
        position: { x, y },
        data: { ...goal },
        draggable: true,
      });

      edges.push({
        id: `edge-identity-goal-${goal.id}`,
        source: "identity",
        target: `goal-${goal.id}`,
        type: "smoothstep",
        animated: false,
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      });
    });

    // Interests in lower arc
    const interestRadius = 220;
    interests.forEach((interest, index) => {
      const angle = (Math.PI * (index + 1)) / (interests.length + 1);
      const x = 400 + interestRadius * Math.cos(angle);
      const y = 300 + interestRadius * Math.sin(angle);

      nodes.push({
        id: `interest-${interest.id}`,
        type: "interest",
        position: { x, y },
        data: { ...interest },
        draggable: true,
      });

      edges.push({
        id: `edge-identity-interest-${interest.id}`,
        source: "identity",
        target: `interest-${interest.id}`,
        type: "smoothstep",
        animated: false,
        style: { stroke: "hsl(var(--secondary-foreground) / 0.5)", strokeWidth: 2 },
      });
    });

    // Inspirations connected to their goals
    inspirations.forEach((inspiration, index) => {
      const connectedGoalIndex = goals.findIndex(g => g.id === inspiration.connected_goal_id);
      let x: number, y: number;

      if (connectedGoalIndex !== -1 && inspiration.connected_goal_id) {
        // Position near the connected goal
        const goalAngle = Math.PI + (Math.PI * (connectedGoalIndex + 1)) / (goals.length + 1);
        const offset = 120 + (index % 3) * 40;
        x = 400 + (goalRadius + offset) * Math.cos(goalAngle + 0.2);
        y = 300 + (goalRadius + offset) * Math.sin(goalAngle + 0.2);

        // Edge to goal with insight label
        edges.push({
          id: `edge-inspiration-${inspiration.id}`,
          source: `goal-${inspiration.connected_goal_id}`,
          target: `inspiration-${inspiration.id}`,
          type: "smoothstep",
          animated: true,
          label: inspiration.hidden_insight?.slice(0, 40) + (inspiration.hidden_insight && inspiration.hidden_insight.length > 40 ? "..." : ""),
          labelStyle: { 
            fontSize: 10, 
            fill: "hsl(var(--muted-foreground))",
            fontWeight: 500,
          },
          labelBgStyle: { 
            fill: "hsl(var(--card))", 
            fillOpacity: 0.9,
          },
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 4,
          style: { 
            stroke: `hsl(${24 + (inspiration.insight_strength || 0) * 10}, 100%, 50%)`,
            strokeWidth: 2,
          },
        });
      } else {
        // Position in outer ring if no connection
        const angle = (2 * Math.PI * index) / Math.max(inspirations.length, 1);
        x = 400 + 380 * Math.cos(angle);
        y = 300 + 380 * Math.sin(angle);
      }

      nodes.push({
        id: `inspiration-${inspiration.id}`,
        type: "inspiration",
        position: { x, y },
        data: { ...inspiration },
        draggable: true,
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [goals, interests, inspirations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(var(--border))" />
        <Controls className="!bg-card !border-border !rounded-xl overflow-hidden" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "identity") return "hsl(var(--primary))";
            if (node.type === "goal") return "hsl(var(--primary))";
            if (node.type === "interest") return "hsl(265, 89%, 78%)";
            if (node.type === "inspiration") return "hsl(var(--accent))";
            return "hsl(var(--muted))";
          }}
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-card !border-border !rounded-xl"
        />
      </ReactFlow>
    </div>
  );
};

export default CreativityMindMap;
