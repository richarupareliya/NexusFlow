import assert from "node:assert/strict";
import test from "node:test";
import { from, lastValueFrom, toArray } from "rxjs";
import { compileGraph, simulateGraph } from "../src/compiler.js";

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

test("simulates telemetry and reports alert results", async () => {
  const result = await simulateGraph(graph, [
    { deviceId: "turbine-01", value: 79, timestamp: "2026-08-15T10:00:00Z" },
    { deviceId: "turbine-01", value: 85, timestamp: "2026-08-15T10:00:01Z" },
  ]);

  assert.equal(result.processed, 2);
  assert.equal(result.alertCount, 1);
  assert.equal(result.alerts[0].value, 82);
});

test("rejects malformed and oversized simulation data", async () => {
  await assert.rejects(() => simulateGraph(graph, []), /non-empty array/);
  await assert.rejects(
    () => simulateGraph(graph, [{ deviceId: "turbine-01", value: "hot" }]),
    /finite number/,
  );
  await assert.rejects(
    () => simulateGraph(graph, Array.from({ length: 1001 }, () => ({ deviceId: "x", value: 1 }))),
    /at most 1000/,
  );
});
