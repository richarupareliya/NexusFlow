export const NODE_LIBRARY = Object.freeze({
  source: {
    label: "Turbine Sensor",
    category: "Data source",
    style: { borderColor: "#22d3ee", background: "#10283b", color: "#e6fbff" },
  },
  operation: {
    label: "Moving Average",
    category: "Math operation",
    style: { borderColor: "#a78bfa", background: "#251d3b", color: "#f4efff" },
  },
  action: {
    label: "SMS Alert",
    category: "Action trigger",
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
    type: "default",
    position,
    data: { label: definition.label, nodeType: type, category: definition.category },
    style: definition.style,
  };
}

