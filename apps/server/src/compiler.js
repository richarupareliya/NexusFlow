import { filter, map, scan, share } from "rxjs";
import { orderGraph, validateGraph } from "./graph.js";

function movingAverage(windowSize) {
  const size = Number(windowSize);
  if (!Number.isInteger(size) || size < 1 || size > 1000) {
    throw new TypeError("moving-average windowSize must be an integer between 1 and 1000.");
  }

  return (source) => source.pipe(
    scan(
      (state, point) => {
        const values = [...state.values, point.value].slice(-size);
        const average = values.reduce((total, value) => total + value, 0) / values.length;
        return { values, point: { ...point, value: average } };
      },
      { values: [], point: null },
    ),
    map((state) => state.point),
  );
}

function compileNode(node) {
  if (node.type === "source") {
    const { deviceId } = node.config ?? {};
    return deviceId ? filter((point) => point.deviceId === deviceId) : (source) => source;
  }
  if (node.type === "operation") {
    return movingAverage(node.config?.windowSize ?? 10);
  }
  if (node.type === "action") {
    const threshold = Number(node.config?.threshold);
    if (!Number.isFinite(threshold)) {
      throw new TypeError("action threshold must be a finite number.");
    }
    return filter((point) => point.value > threshold);
  }
  throw new TypeError(`cannot compile node type: ${node.type}`);
}

export function compileGraph(graph, telemetry$) {
  validateGraph(graph);
  if (!telemetry$?.pipe) {
    throw new TypeError("telemetry$ must be an Observable.");
  }

  const inbound = new Map(graph.nodes.map((node) => [node.id, 0]));
  const outbound = new Map(graph.nodes.map((node) => [node.id, 0]));
  for (const edge of graph.edges) {
    inbound.set(edge.target, inbound.get(edge.target) + 1);
    outbound.set(edge.source, outbound.get(edge.source) + 1);
  }
  const sources = graph.nodes.filter((node) => inbound.get(node.id) === 0);
  const sinks = graph.nodes.filter((node) => outbound.get(node.id) === 0);
  const isLinear = sources.length === 1
    && sinks.length === 1
    && graph.edges.length === graph.nodes.length - 1
    && graph.nodes.every((node) => inbound.get(node.id) <= 1 && outbound.get(node.id) <= 1);
  if (!isLinear) {
    throw new TypeError("the current compiler supports one linear source-to-action pipeline.");
  }

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  let pipeline$ = telemetry$;
  for (const nodeId of orderGraph(graph)) {
    pipeline$ = pipeline$.pipe(compileNode(nodesById.get(nodeId)));
  }
  return pipeline$.pipe(share());
}
