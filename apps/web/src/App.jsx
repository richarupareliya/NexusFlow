import { useCallback, useRef, useState } from "react";
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
import { createCanvasNode, NODE_LIBRARY } from "./canvasModel.js";

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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlow, setReactFlow] = useState(null);
  const nextNodeId = useRef(initialNodes.length + 1);
  const onConnect = useCallback(
    (connection) => setEdges((currentEdges) => addEdge({ ...connection, animated: true }, currentEdges)),
    [setEdges],
  );

  const addNode = useCallback(
    (type, position) => {
      const id = `${type}-${nextNodeId.current++}`;
      setNodes((currentNodes) => [...currentNodes, createCanvasNode(type, id, position)]);
    },
    [setNodes],
  );

  const addNodeFromLibrary = useCallback(
    (type) => addNode(type, { x: 180 + nodes.length * 24, y: 100 + nodes.length * 18 }),
    [addNode, nodes.length],
  );

  const onDragStart = useCallback((event, type) => {
    event.dataTransfer.setData("application/nexusflow-node", type);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/nexusflow-node");
      if (!reactFlow || !NODE_LIBRARY[type]) return;
      addNode(type, reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addNode, reactFlow],
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
          <p>Drag a node onto the canvas or click to add it.</p>
          {Object.entries(NODE_LIBRARY).map(([type, definition]) => (
            <button
              key={type}
              type="button"
              draggable
              onClick={() => addNodeFromLibrary(type)}
              onDragStart={(event) => onDragStart(event, type)}
            >
              <span aria-hidden="true">{type === "source" ? "＋" : type === "operation" ? "ƒ" : "⚡"}</span>
              {definition.category}
            </button>
          ))}
        </aside>

        <div className="canvas" aria-label="Visual telemetry pipeline editor">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlow}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={onDrop}
            fitView
          >
            <Background color="#25405c" gap={24} />
            <Controls />
            <MiniMap nodeColor="#22d3ee" maskColor="rgba(5, 12, 24, 0.72)" />
            <Panel position="top-right" className="hint">
              {nodes.length} nodes · {edges.length} connections
            </Panel>
          </ReactFlow>
        </div>
      </section>
    </main>
  );
}
