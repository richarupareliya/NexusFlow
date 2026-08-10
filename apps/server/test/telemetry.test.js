import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBatch, normalizeTelemetry } from "../src/telemetry.js";

test("normalizes a telemetry point for the time-series collection", () => {
  const receivedAt = new Date("2026-08-10T10:00:00.000Z");
  const result = normalizeTelemetry(
    { deviceId: " turbine-01 ", metric: "temperature", value: 82.4 },
    receivedAt,
  );

  assert.deepEqual(result, {
    timestamp: receivedAt,
    metadata: { deviceId: "turbine-01", metric: "temperature", tags: {} },
    value: 82.4,
    receivedAt,
  });
});

test("rejects invalid values and timestamps", () => {
  assert.throws(
    () => normalizeTelemetry({ deviceId: "a", metric: "temp", value: "82" }),
    /finite number/,
  );
  assert.throws(
    () => normalizeTelemetry({ deviceId: "a", metric: "temp", value: 82, timestamp: "bad" }),
    /valid date/,
  );
});

test("accepts a batch but rejects an empty batch", () => {
  const result = normalizeBatch([
    { deviceId: "a", metric: "pressure", value: 12 },
    { deviceId: "b", metric: "pressure", value: 13 },
  ]);
  assert.equal(result.length, 2);
  assert.throws(() => normalizeBatch([]), /Batch size/);
});

