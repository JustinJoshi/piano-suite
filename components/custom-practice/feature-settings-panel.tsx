"use client";

import type { FeatureBlock, FieldDescriptor } from "@/lib/feature-blocks/types";
import { getFeatureDefinition } from "@/lib/feature-blocks/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FeatureSettingsPanelProps = {
  block: FeatureBlock;
  onChange: (config: Record<string, unknown>) => void;
};

export function FeatureSettingsPanel({
  block,
  onChange,
}: FeatureSettingsPanelProps) {
  const def = getFeatureDefinition(block.type);
  if (!def) return null;

  const config = def.normalizeConfig(block.config) as Record<string, unknown>;

  function updateField(key: string, value: unknown) {
    onChange({ ...config, [key]: value });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{def.label} settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {def.fields.map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            value={config[field.key]}
            onChange={(value) => updateField(field.key, value)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDescriptor;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `field-${field.key}`;

  if (field.kind === "range") {
    const numericValue = typeof value === "number" ? value : field.min;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {field.label}
          </label>
          <span className="text-sm tabular-nums text-foreground">
            {numericValue}
          </span>
        </div>
        <input
          id={id}
          type="range"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={numericValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        {field.helperText ? (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        ) : null}
      </div>
    );
  }

  if (field.kind === "select") {
    const stringValue =
      typeof value === "string" || typeof value === "number"
        ? String(value)
        : String(field.options[0]?.value ?? "");
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          {field.label}
        </label>
        <select
          id={id}
          value={stringValue}
          onChange={(e) => {
            const option = field.options.find(
              (o) => String(o.value) === e.target.value
            );
            onChange(option?.value ?? field.options[0]?.value);
          }}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
        >
          {field.options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
        {field.helperText ? (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        ) : null}
      </div>
    );
  }

  // toggle
  const checked = typeof value === "boolean" ? value : false;
  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {field.label}
      </label>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-primary"
      />
    </div>
  );
}
