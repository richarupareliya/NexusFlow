import "dotenv/config";
import { createApp } from "./app.js";
import { getConfig } from "./config.js";
import { connectDatabase } from "./db.js";

const config = getConfig();
const database = await connectDatabase(config);
const app = createApp(database);
const server = app.listen(config.port, () => {
  console.log(`NexusFlow ingestion API listening on http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  server.close(async () => {
    await database.client.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

