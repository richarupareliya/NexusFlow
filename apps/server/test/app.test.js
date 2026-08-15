import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

const graph = {
  version: 1,
  nodes: [
    { id: "source", type: "source", config: { deviceId: "turbine-01" } },
    { id: "alert", type: "action", config: { threshold: 80 } },
  ],
  edges: [{ id: "edge", source: "source", target: "alert" }],
};

async function withServer(run) {
  const app = createApp({ telemetry: { insertMany: async () => ({ insertedCount: 0 }) } });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("simulates a serialized graph over HTTP", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/graphs/simulate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        graph,
        telemetry: [
          { deviceId: "turbine-01", value: 75 },
          { deviceId: "turbine-01", value: 86 },
        ],
      }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      processed: 2,
      alertCount: 1,
      alerts: [{ deviceId: "turbine-01", value: 86 }],
    });
  });
});

test("returns a useful 400 response for invalid simulations", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/graphs/simulate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ graph, telemetry: [] }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /non-empty array/);
  });
});

