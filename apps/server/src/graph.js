const ALLOWED_NODE_TYPES = new Set(["source", "operation", "action"]);

function assertArray(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array.`);
  }
}

export function validateGraph(graph) {
  if (graph === null || typeof graph !== "object" || Array.isArray(graph)) {
    throw new TypeError("graph must be an object.");
  }

  const { version, nodes, edges } = graph;
  if (version !== 1) {
    throw new TypeError("graph version must be 1.");
  }
  assertArray(nodes, "nodes");
  assertArray(edges, "edges");
  if (nodes.length === 0) {
    throw new TypeError("graph must contain at least one node.");
  }

  const nodeIds = new Set();
  for (const node of nodes) {
    if (typeof node?.id !== "string" || node.id.trim() === "") {
      throw new TypeError("every node must have a non-empty id.");
    }
    if (nodeIds.has(node.id)) {
      throw new TypeError(`duplicate node id: ${node.id}`);
    }
    if (!ALLOWED_NODE_TYPES.has(node.type)) {
      throw new TypeError(`unsupported node type: ${node.type}`);
    }
    nodeIds.add(node.id);
  }

  const edgeIds = new Set();
  for (const edge of edges) {
    if (typeof edge?.id !== "string" || edge.id.trim() === "") {
      throw new TypeError("every edge must have a non-empty id.");
    }
    if (edgeIds.has(edge.id)) {
      throw new TypeError(`duplicate edge id: ${edge.id}`);
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new TypeError(`edge ${edge.id} references a missing node.`);
    }
    if (edge.source === edge.target) {
      throw new TypeError(`edge ${edge.id} cannot connect a node to itself.`);
    }
    edgeIds.add(edge.id);
  }

  return {
    valid: true,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

