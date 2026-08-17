import { ObjectId } from "mongodb";
import { validateGraph } from "./graph.js";

export class GraphStoreError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "GraphStoreError";
    this.statusCode = statusCode;
  }
}

function validateName(name) {
  if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 80) {
    throw new TypeError("name must contain between 3 and 80 characters.");
  }
  return name.trim();
}

function parseId(id) {
  if (!ObjectId.isValid(id)) throw new TypeError("graph id is invalid.");
  return new ObjectId(id);
}

function toPublicGraph(document) {
  return {
    id: document._id.toString(),
    name: document.name,
    graph: document.graph,
    revision: document.revision,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export function createGraphStore(collection, clock = () => new Date()) {
  if (!collection) throw new TypeError("a graph collection is required.");

  return {
    async create({ name, graph }) {
      const normalizedName = validateName(name);
      validateGraph(graph);
      const now = clock();
      const document = {
        name: normalizedName,
        graph,
        revision: 1,
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(document);
      return toPublicGraph({ ...document, _id: result.insertedId });
    },

    async get(id) {
      const document = await collection.findOne({ _id: parseId(id) });
      if (!document) throw new GraphStoreError("graph was not found.", 404);
      return toPublicGraph(document);
    },

    async update(id, { name, graph, revision }) {
      const objectId = parseId(id);
      const normalizedName = validateName(name);
      validateGraph(graph);
      if (!Number.isInteger(revision) || revision < 1) {
        throw new TypeError("revision must be a positive integer.");
      }

      const result = await collection.findOneAndUpdate(
        { _id: objectId, revision },
        {
          $set: { name: normalizedName, graph, updatedAt: clock() },
          $inc: { revision: 1 },
        },
        { returnDocument: "after" },
      );
      if (!result) {
        const exists = await collection.findOne({ _id: objectId }, { projection: { _id: 1 } });
        if (!exists) throw new GraphStoreError("graph was not found.", 404);
        throw new GraphStoreError("graph revision is stale; reload before saving.", 409);
      }
      return toPublicGraph(result);
    },
  };
}

