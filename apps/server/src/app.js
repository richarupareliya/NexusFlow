import cors from "cors";
import express from "express";
import { simulateGraph } from "./compiler.js";
import { validateGraph } from "./graph.js";
import { createGraphStore, GraphStoreError } from "./graphStore.js";
import { normalizeBatch } from "./telemetry.js";

export function createApp({ telemetry, graphs }) {
  const app = express();
  const graphStore = graphs ? createGraphStore(graphs) : null;
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "nexusflow-ingestion" });
  });

  app.post("/api/v1/telemetry", async (request, response, next) => {
    try {
      const documents = normalizeBatch(request.body);
      const result = await telemetry.insertMany(documents, { ordered: false });
      response.status(202).json({
        accepted: result.insertedCount,
        receivedAt: documents[0].receivedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/graphs/validate", (request, response, next) => {
    try {
      response.json(validateGraph(request.body));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/graphs/simulate", async (request, response, next) => {
    try {
      const { graph, telemetry: telemetryPoints } = request.body ?? {};
      response.json(await simulateGraph(graph, telemetryPoints));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/graphs", async (request, response, next) => {
    try {
      if (!graphStore) throw new GraphStoreError("graph storage is unavailable.", 503);
      response.status(201).json(await graphStore.create(request.body ?? {}));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/graphs/:id", async (request, response, next) => {
    try {
      if (!graphStore) throw new GraphStoreError("graph storage is unavailable.", 503);
      response.json(await graphStore.get(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/v1/graphs/:id", async (request, response, next) => {
    try {
      if (!graphStore) throw new GraphStoreError("graph storage is unavailable.", 503);
      response.json(await graphStore.update(request.params.id, request.body ?? {}));
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof TypeError || error instanceof RangeError) {
      response.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof GraphStoreError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error(error);
    response.status(500).json({ error: "NexusFlow request failed." });
  });

  return app;
}
