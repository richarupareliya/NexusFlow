import assert from "node:assert/strict";
import test from "node:test";
import { createCanvasNode, NODE_LIBRARY, serializeGraph, updateNodeConfig } from "../src/canvasModel.js";

test("creates a configured node from the library", () => {
  const node = createCanvasNode("source", "source-4", { x: 120, y: 80 });

  assert.equal(node.id, "source-4");
  assert.deepEqual(node.position, { x: 120, y: 80 });
  assert.deepEqual(node.data, {
    label: "Turbine Sensor",
    nodeType: "source",
    category: "Data source",
    config: { deviceId: "turbine-01" },
  });
  assert.equal(node.style.borderColor, "#22d3ee");
});

test("exposes the three Week 1 node categories", () => {
  assert.deepEqual(Object.keys(NODE_LIBRARY), ["source", "operation", "action"]);
});

test("rejects unknown node types and invalid positions", () => {
  assert.throws(() => createCanvasNode("unknown", "node-1", { x: 0, y: 0 }), /Unknown/);
  assert.throws(() => createCanvasNode("source", "node-1", { x: NaN, y: 0 }), /position/);
});

test("serializes React Flow state into the compiler contract", () => {
  const nodes = [createCanvasNode("source", "source-1", { x: 10, y: 20 })];
  const graph = serializeGraph(nodes, [{ id: "edge-1", source: "source-1", target: "source-2" }]);

  assert.deepEqual(graph, {
    version: 1,
    nodes: [{
      id: "source-1",
      type: "source",
      config: { deviceId: "turbine-01" },
      position: { x: 10, y: 20 },
    }],
    edges: [{
      id: "edge-1",
      source: "source-1",
      target: "source-2",
      sourceHandle: null,
      targetHandle: null,
    }],
  });
});

test("updates one node configuration without mutating other nodes", () => {
  const source = createCanvasNode("source", "source-1", { x: 0, y: 0 });
  const action = createCanvasNode("action", "action-1", { x: 100, y: 0 });
  const updated = updateNodeConfig([source, action], "action-1", { threshold: 92 });

  assert.deepEqual(updated[1].data.config, { threshold: 92 });
  assert.equal(updated[0], source);
  assert.deepEqual(action.data.config, { threshold: 80 });
});
