import assert from "node:assert/strict";
import test from "node:test";
import { from, lastValueFrom, toArray } from "rxjs";
import { compileGraph } from "../src/compiler.js";

const graph = {
  version: 1,
  nodes: [
    { id: "sensor", type: "source", config: { deviceId: "turbine-01" } },
    { id: "average", type: "operation", config: { windowSize: 2 } },
    { id: "alert", type: "action", config: { threshold: 80 } },
  ],
  edges: [
    { id: "e1", source: "sensor", target: "average" },
    { id: "e2", source: "average", target: "alert" },
  ],
};

test("compiles source, moving-average, and action nodes into an RxJS pipeline", async () => {
  const input = from([
    { deviceId: "other", value: 100 },
    { deviceId: "turbine-01", value: 78 },
    { deviceId: "turbine-01", value: 84 },
    { deviceId: "turbine-01", value: 90 },
  ]);

  const alerts = await lastValueFrom(compileGraph(graph, input).pipe(toArray()));
  assert.deepEqual(alerts.map((point) => point.value), [81, 87]);
});

test("rejects invalid operation and action configuration", () => {
  const invalidWindow = {
    ...graph,
    nodes: graph.nodes.map((node) => node.id === "average" ? { ...node, config: { windowSize: 0 } } : node),
  };
  assert.throws(() => compileGraph(invalidWindow, from([])), /windowSize/);

  const invalidThreshold = {
    ...graph,
    nodes: graph.nodes.map((node) => node.id === "alert" ? { ...node, config: { threshold: "bad" } } : node),
  };
  assert.throws(() => compileGraph(invalidThreshold, from([])), /threshold/);
});

test("rejects branching until multi-stream compilation is supported", () => {
  const branchingGraph = {
    ...graph,
    nodes: [...graph.nodes, { id: "second-alert", type: "action", config: { threshold: 90 } }],
    edges: [...graph.edges, { id: "e3", source: "average", target: "second-alert" }],
  };

  assert.throws(() => compileGraph(branchingGraph, from([])), /linear source-to-action/);
});
