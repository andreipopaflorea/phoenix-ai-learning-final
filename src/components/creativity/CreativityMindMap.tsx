import { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  ConnectionMode,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  MarkerType,
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

interface InspirationConnection {
  id: string;
  inspiration_id: string;
  goal_id: string;
  insight_note: string | null;
}

export interface NodeConnection {
  id: string;
  sourceType: 'goal' | 'interest' | 'inspiration';
  sourceId: string;
  targetType: 'goal' | 'interest' | 'inspiration';
  targetId: string;
}

interface CreativityMindMapProps {
  goals: Goal[];
  interests: Interest[];
  inspirations: Inspiration[];
  connections: InspirationConnection[];
  nodeConnections: NodeConnection[];
  onConnect: (sourceType: string, sourceId: string, targetType: string, targetId: string) => void;
  onDisconnect: (connectionId: string, isNodeConnection?: boolean) => void;
}

const nodeTypes = {
  identity: IdentityNode,
  goal: GoalNode,
  interest: InterestNode,
  inspiration: InspirationNode,
};

const CreativityMindMap = ({ 
  goals, 
  interests, 
  inspirations, 
  connections,
  nodeConnections,
  onConnect,
  onDisconnect,
}: CreativityMindMapProps) => {
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

    // Calculate inspiration positions
    const inspirationPositions = new Map<string, { x: number; y: number }>();
    
    inspirations.forEach((inspiration, index) => {
      // Check all connections for this inspiration
      const inspirationConnections = connections.filter(c => c.inspiration_id === inspiration.id);
      const primaryGoalId = inspiration.connected_goal_id || inspirationConnections[0]?.goal_id;
      const connectedGoalIndex = primaryGoalId ? goals.findIndex(g => g.id === primaryGoalId) : -1;
      
      let x: number, y: number;

      if (connectedGoalIndex !== -1) {
        // Position near the connected goal
        const goalAngle = Math.PI + (Math.PI * (connectedGoalIndex + 1)) / (goals.length + 1);
        const offset = 120 + (index % 3) * 40;
        x = 400 + (goalRadius + offset) * Math.cos(goalAngle + 0.2 * ((index % 2) ? 1 : -1));
        y = 300 + (goalRadius + offset) * Math.sin(goalAngle + 0.2 * ((index % 2) ? 1 : -1));
      } else {
        // Position in outer ring if no connection
        const angle = (2 * Math.PI * index) / Math.max(inspirations.length, 1);
        x = 400 + 380 * Math.cos(angle);
        y = 300 + 380 * Math.sin(angle);
      }

      inspirationPositions.set(inspiration.id, { x, y });

      nodes.push({
        id: `inspiration-${inspiration.id}`,
        type: "inspiration",
        position: { x, y },
        data: { ...inspiration },
        draggable: true,
      });
    });

    // Add edges from connections table
    connections.forEach((conn) => {
      const inspiration = inspirations.find(i => i.id === conn.inspiration_id);
      edges.push({
        id: `connection-${conn.id}`,
        source: `goal-${conn.goal_id}`,
        target: `inspiration-${conn.inspiration_id}`,
        type: "smoothstep",
        animated: true,
        label: conn.insight_note?.slice(0, 30) || undefined,
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
          stroke: "hsl(var(--primary))",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "hsl(var(--primary))",
        },
        data: { connectionId: conn.id },
      });
    });

    // Also add edges from legacy connected_goal_id (if not already in connections)
    inspirations.forEach((inspiration) => {
      if (inspiration.connected_goal_id) {
        const existsInConnections = connections.some(
          c => c.inspiration_id === inspiration.id && c.goal_id === inspiration.connected_goal_id
        );
        
        if (!existsInConnections) {
          edges.push({
            id: `edge-legacy-${inspiration.id}`,
            source: `goal-${inspiration.connected_goal_id}`,
            target: `inspiration-${inspiration.id}`,
            type: "smoothstep",
            animated: true,
            label: inspiration.hidden_insight?.slice(0, 30) || undefined,
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
        }
      }
    });

    // Add edges from generic node connections (for interests connecting to anything)
    nodeConnections.forEach((conn) => {
      const edgeId = `node-connection-${conn.id}`;
      // Determine stroke color based on connection type
      let strokeColor = "hsl(265, 89%, 78%)"; // Purple for interest connections
      if (conn.sourceType === 'inspiration' || conn.targetType === 'inspiration') {
        strokeColor = "hsl(var(--primary))";
      }

      edges.push({
        id: edgeId,
        source: `${conn.sourceType}-${conn.sourceId}`,
        target: `${conn.targetType}-${conn.targetId}`,
        type: "smoothstep",
        animated: true,
        style: { 
          stroke: strokeColor,
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
        },
        data: { nodeConnectionId: conn.id },
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [goals, interests, inspirations, connections, nodeConnections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Parse node type and ID from ReactFlow node ID
  const parseNodeId = (nodeId: string): { type: string; id: string } | null => {
    const types = ['goal', 'interest', 'inspiration'];
    for (const type of types) {
      if (nodeId.startsWith(`${type}-`)) {
        return { type, id: nodeId.replace(`${type}-`, '') };
      }
    }
    return null;
  };

  // Handle new connection creation
  const handleConnect = useCallback((params: Connection) => {
    const sourceId = params.source;
    const targetId = params.target;

    if (!sourceId || !targetId) return;
    if (sourceId === 'identity' || targetId === 'identity') return; // Don't allow connecting to identity

    const source = parseNodeId(sourceId);
    const target = parseNodeId(targetId);

    if (!source || !target) return;
    if (source.type === target.type && source.id === target.id) return; // No self-connections

    // Check if connection already exists
    const existingEdge = edgesState.find(
      e => (e.source === sourceId && e.target === targetId) ||
           (e.source === targetId && e.target === sourceId)
    );

    if (!existingEdge) {
      onConnect(source.type, source.id, target.type, target.id);
      
      // Determine stroke color
      let strokeColor = "hsl(var(--primary))";
      if (source.type === 'interest' || target.type === 'interest') {
        strokeColor = "hsl(265, 89%, 78%)";
      }
      
      // Optimistically add edge
      const newEdge: Edge = {
        id: `temp-${Date.now()}`,
        source: sourceId,
        target: targetId,
        type: "smoothstep",
        animated: true,
        style: { 
          stroke: strokeColor,
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    }
  }, [edgesState, onConnect, setEdges]);

  // Handle edge deletion
  const handleEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach((edge) => {
      if (edge.data?.connectionId) {
        onDisconnect(edge.data.connectionId, false);
      } else if (edge.data?.nodeConnectionId) {
        onDisconnect(edge.data.nodeConnectionId, true);
      }
    });
  }, [onDisconnect]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onEdgesDelete={handleEdgesDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        deleteKeyCode={["Backspace", "Delete"]}
        connectionLineStyle={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.SmoothStep}
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
      
      {/* Connection hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-card/90 backdrop-blur-sm rounded-full border border-border text-xs text-muted-foreground">
        💡 Drag between any nodes to create connections
      </div>
    </div>
  );
};

export default CreativityMindMap;
