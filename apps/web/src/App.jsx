import { useCallback } from "react";
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

const initialNodes = [
  {
    id: "turbine-01",
    position: { x: 80, y: 150 },
    data: { label: "Turbine Sensor" },
    style: { borderColor: "#22d3ee", background: "#10283b", color: "#e6fbff" },
  },
  {
    id: "average-01",
    position: { x: 360, y: 150 },
    data: { label: "Moving Average" },
    style: { borderColor: "#a78bfa", background: "#251d3b", color: "#f4efff" },
  },
  {
    id: "alert-01",
    position: { x: 650, y: 150 },
    data: { label: "SMS Alert" },
    style: { borderColor: "#fb7185", background: "#3b1821", color: "#fff1f3" },
  },
];

const initialEdges = [
  { id: "sensor-average", source: "turbine-01", target: "average-01", animated: true },
  { id: "average-alert", source: "average-01", target: "alert-01", animated: true },
];

export function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (connection) => setEdges((currentEdges) => addEdge({ ...connection, animated: true }, currentEdges)),
    [setEdges],
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">IoT telemetry orchestration</p>
          <h1>Nexus<span>Flow</span></h1>
        </div>
        <div className="status"><i /> Engine ready</div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <h2>Node library</h2>
          <p>Week 1 canvas scaffold</p>
          <button type="button">＋ Data source</button>
          <button type="button">ƒ Math operation</button>
          <button type="button">⚡ Action trigger</button>
        </aside>

        <div className="canvas" aria-label="Visual telemetry pipeline editor">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background color="#25405c" gap={24} />
            <Controls />
            <MiniMap nodeColor="#22d3ee" maskColor="rgba(5, 12, 24, 0.72)" />
            <Panel position="top-right" className="hint">Drag nodes · connect handles · zoom to explore</Panel>
          </ReactFlow>
        </div>
      </section>
    </main>
  );
}

