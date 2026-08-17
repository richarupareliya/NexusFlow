import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";
import { createGraphStore, GraphStoreError } from "../src/graphStore.js";

const graph = {
  version: 1,
  nodes: [
    { id: "source", type: "source", config: { deviceId: "turbine-01" } },
    { id: "alert", type: "action", config: { threshold: 80 } },
  ],
  edges: [{ id: "edge", source: "source", target: "alert" }],
};

function memoryCollection() {
  const documents = new Map();
  return {
    documents,
    async insertOne(document) {
      const insertedId = new ObjectId();
      documents.set(insertedId.toString(), { ...document, _id: insertedId });
      return { insertedId };
    },
    async findOne(filter) {
      return documents.get(filter._id.toString()) ?? null;
    },
    async findOneAndUpdate(filter, update) {
      const current = documents.get(filter._id.toString());
      if (!current || current.revision !== filter.revision) return null;
      const next = {
        ...current,
        ...update.$set,
        revision: current.revision + update.$inc.revision,
      };
      documents.set(filter._id.toString(), next);
      return next;
    },
  };
}

test("creates and retrieves a validated rule graph", async () => {
  const collection = memoryCollection();
  const now = new Date("2026-08-17T10:00:00Z");
  const store = createGraphStore(collection, () => now);
  const created = await store.create({ name: " Turbine safety ", graph });

  assert.equal(created.name, "Turbine safety");
  assert.equal(created.revision, 1);
  assert.equal(created.createdAt, now);
  assert.deepEqual(await store.get(created.id), created);
});

test("updates a graph using optimistic revision control", async () => {
  const collection = memoryCollection();
  const store = createGraphStore(collection);
  const created = await store.create({ name: "Turbine safety", graph });
  const updated = await store.update(created.id, {
    name: "Turbine critical alert",
    graph,
    revision: 1,
  });

  assert.equal(updated.revision, 2);
  assert.equal(updated.name, "Turbine critical alert");
  await assert.rejects(
    () => store.update(created.id, { name: "Old edit", graph, revision: 1 }),
    (error) => error instanceof GraphStoreError && error.statusCode === 409,
  );
});

test("rejects invalid names and missing graph ids", async () => {
  const store = createGraphStore(memoryCollection());
  await assert.rejects(() => store.create({ name: "x", graph }), /between 3 and 80/);
  await assert.rejects(() => store.get(new ObjectId().toString()), /not found/);
  await assert.rejects(() => store.get("not-an-id"), /invalid/);
});

