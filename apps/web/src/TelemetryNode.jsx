import { Handle, Position } from "@xyflow/react";

const fieldByType = {
  source: { key: "deviceId", label: "Device ID", type: "text", min: undefined },
  operation: { key: "windowSize", label: "Window size", type: "number", min: 1 },
  action: { key: "threshold", label: "Threshold", type: "number", min: undefined },
};

export function TelemetryNode({ data }) {
  const field = fieldByType[data.nodeType];
  const value = data.config?.[field.key] ?? "";

  const updateValue = (event) => {
    const nextValue = field.type === "number" ? Number(event.target.value) : event.target.value;
    data.onConfigChange?.({ ...data.config, [field.key]: nextValue });
  };

  return (
    <article className={`telemetry-node telemetry-node--${data.nodeType}`}>
      {data.nodeType !== "source" && <Handle type="target" position={Position.Left} />}
      <span className="node-category">{data.category}</span>
      <strong>{data.label}</strong>
      <label>
        {field.label}
        <input
          className="nodrag"
          type={field.type}
          min={field.min}
          value={value}
          onChange={updateValue}
          aria-label={`${data.label} ${field.label}`}
        />
      </label>
      {data.nodeType !== "action" && <Handle type="source" position={Position.Right} />}
    </article>
  );
}

