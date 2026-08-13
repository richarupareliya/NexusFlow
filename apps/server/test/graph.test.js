import assert from "node:assert/strict";
import test from "node:test";
import { orderGraph, validateGraph } from "../src/graph.js";

const validGraph = {
  version: 1,
  nodes: [
    { id: "sensor-1", type: "source", config: {} },
    { id: "average-1", type: "operation", config: {} },
    { id: "alert-1", type: "action", config: {} },
  ],
  edges: [
    { id: "e1", source: "sensor-1", target: "average-1" },
    { id: "e2", source: "average-1", target: "alert-1" },
  ],
};

test("accepts a compiler-ready graph", () => {
  assert.deepEqual(validateGraph(validGraph), { valid: true, nodeCount: 3, edgeCount: 2 });
});

test("rejects duplicate nodes and unsupported node types", () => {
  assert.throws(
    () => validateGraph({ ...validGraph, nodes: [validGraph.nodes[0], validGraph.nodes[0]] }),
    /duplicate node/,
  );
  assert.throws(
    () => validateGraph({ ...validGraph, nodes: [{ id: "x", type: "unknown" }] }),
    /unsupported node type/,
  );
});

test("rejects dangling and self-referencing edges", () => {
  assert.throws(
    () => validateGraph({ ...validGraph, edges: [{ id: "bad", source: "sensor-1", target: "missing" }] }),
    /missing node/,
  );
  assert.throws(
    () => validateGraph({ ...validGraph, edges: [{ id: "loop", source: "sensor-1", target: "sensor-1" }] }),
    /itself/,
  );
});

test("orders graph nodes from source to action", () => {
  assert.deepEqual(orderGraph(validGraph), ["sensor-1", "average-1", "alert-1"]);
});

test("rejects cyclic graphs", () => {
  assert.throws(
    () => validateGraph({
      version: 1,
      nodes: [
        { id: "a", type: "operation" },
        { id: "b", type: "operation" },
      ],
      edges: [
        { id: "ab", source: "a", target: "b" },
        { id: "ba", source: "b", target: "a" },
      ],
    }),
    /cycles/,
  );
});
