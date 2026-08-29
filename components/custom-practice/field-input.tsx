"use client";

import type { FieldDescriptor } from "@/lib/feature-blocks/types";

/**
 * Renders one settings field described by a FieldDescriptor.
 * Shared by the workshop tile's gear panel (and any future settings UI).
 */
export function FieldInput({
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

  if (field.kind === "checkbox-group") {
    const selected = Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string")
      : [];
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {field.label}
        </label>
        <div className="space-y-2">
          {field.options.map((option) => {
            const optionId = `${id}-${option.value}`;
            const isChecked = selected.includes(option.value);
            return (
              <div key={option.value} className="flex items-center gap-2">
                <input
                  id={optionId}
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, option.value]
                      : selected.filter((v) => v !== option.value);
                    onChange(next);
                  }}
                  className="h-4 w-4 accent-primary"
                />
                <label htmlFor={optionId} className="text-sm text-foreground">
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>
        {field.helperText ? (
          <p className="text-xs text-muted-foreground">{field.helperText}</p>
        ) : null}
      </div>
    );
  }

  if (field.kind === "text") {
    const stringValue = typeof value === "string" ? value : "";
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          {field.label}
        </label>
        <textarea
          id={id}
          value={stringValue}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
        />
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
