import { MongoClient } from "mongodb";

const TELEMETRY_COLLECTION = "telemetry";

export async function connectDatabase({ mongoUri, databaseName }) {
  const client = new MongoClient(mongoUri, {
    maxPoolSize: 50,
    minPoolSize: 5,
  });

  await client.connect();
  const database = client.db(databaseName);
  await ensureTelemetryCollection(database);

  return {
    client,
    database,
    telemetry: database.collection(TELEMETRY_COLLECTION),
  };
}

async function ensureTelemetryCollection(database) {
  const existing = await database
    .listCollections({ name: TELEMETRY_COLLECTION }, { nameOnly: true })
    .hasNext();

  if (!existing) {
    await database.createCollection(TELEMETRY_COLLECTION, {
      timeseries: {
        timeField: "timestamp",
        metaField: "metadata",
        granularity: "seconds",
      },
      expireAfterSeconds: 60 * 60 * 24 * 30,
    });
  }
}

