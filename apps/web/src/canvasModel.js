export const NODE_LIBRARY = Object.freeze({
  source: {
    label: "Turbine Sensor",
    category: "Data source",
    defaultConfig: { deviceId: "turbine-01" },
    style: { borderColor: "#22d3ee", background: "#10283b", color: "#e6fbff" },
  },
  operation: {
    label: "Moving Average",
    category: "Math operation",
    defaultConfig: { windowSize: 10 },
    style: { borderColor: "#a78bfa", background: "#251d3b", color: "#f4efff" },
  },
  action: {
    label: "SMS Alert",
    category: "Action trigger",
    defaultConfig: { threshold: 80 },
    style: { borderColor: "#fb7185", background: "#3b1821", color: "#fff1f3" },
  },
});

export function createCanvasNode(type, id, position) {
  const definition = NODE_LIBRARY[type];
  if (!definition) {
    throw new TypeError(`Unknown node type: ${type}`);
  }
  if (typeof id !== "string" || id.trim() === "") {
    throw new TypeError("A node id is required.");
  }
  if (!Number.isFinite(position?.x) || !Number.isFinite(position?.y)) {
    throw new TypeError("A node position with finite x and y values is required.");
  }

  return {
    id,
    type: "telemetryNode",
    position,
    data: {
      label: definition.label,
      nodeType: type,
      category: definition.category,
      config: { ...definition.defaultConfig },
    },
    style: definition.style,
  };
}

export function updateNodeConfig(nodes, nodeId, config) {
  if (!Array.isArray(nodes)) throw new TypeError("nodes must be an array.");
  return nodes.map((node) => node.id === nodeId
    ? { ...node, data: { ...node.data, config: { ...config } } }
    : node);
}

export function serializeGraph(nodes, edges) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new TypeError("nodes and edges must be arrays.");
  }

  return {
    version: 1,
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.data?.nodeType,
      config: node.data?.config ?? {},
      position: { x: node.position.x, y: node.position.y },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? null,
      targetHandle: edge.targetHandle ?? null,
    })),
  };
}
