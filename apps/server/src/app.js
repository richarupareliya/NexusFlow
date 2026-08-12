import cors from "cors";
import express from "express";
import { validateGraph } from "./graph.js";
import { normalizeBatch } from "./telemetry.js";

export function createApp({ telemetry }) {
  const app = express();
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

  app.use((error, _request, response, _next) => {
    if (error instanceof TypeError || error instanceof RangeError) {
      response.status(400).json({ error: error.message });
      return;
    }
    console.error(error);
    response.status(500).json({ error: "Telemetry ingestion failed." });
  });

  return app;
}
