const MAX_BATCH_SIZE = 1000;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeTelemetry(payload, receivedAt = new Date()) {
  if (!isPlainObject(payload)) {
    throw new TypeError("Each telemetry item must be an object.");
  }

  const { deviceId, metric, value, timestamp, tags = {} } = payload;
  if (typeof deviceId !== "string" || deviceId.trim() === "") {
    throw new TypeError("deviceId is required and must be a non-empty string.");
  }
  if (typeof metric !== "string" || metric.trim() === "") {
    throw new TypeError("metric is required and must be a non-empty string.");
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError("value is required and must be a finite number.");
  }
  if (!isPlainObject(tags)) {
    throw new TypeError("tags must be an object.");
  }

  const eventTime = timestamp === undefined ? receivedAt : new Date(timestamp);
  if (Number.isNaN(eventTime.getTime())) {
    throw new TypeError("timestamp must be a valid date.");
  }

  return {
    timestamp: eventTime,
    metadata: {
      deviceId: deviceId.trim(),
      metric: metric.trim(),
      tags,
    },
    value,
    receivedAt,
  };
}

export function normalizeBatch(payload, receivedAt = new Date()) {
  const items = Array.isArray(payload) ? payload : [payload];
  if (items.length === 0 || items.length > MAX_BATCH_SIZE) {
    throw new RangeError(`Batch size must be between 1 and ${MAX_BATCH_SIZE}.`);
  }

  return items.map((item) => normalizeTelemetry(item, receivedAt));
}

