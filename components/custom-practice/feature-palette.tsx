"use client";

import { featureRegistry, featureCategories } from "@/lib/feature-blocks/registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FeaturePaletteProps = {
  onSelect: (type: string) => void;
  onCancel: () => void;
};

export function FeaturePalette({ onSelect, onCancel }: FeaturePaletteProps) {
  const entries = Object.values(featureRegistry);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Add feature</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {featureCategories.map((category) => {
          const categoryEntries = entries.filter(
            (entry) => entry.category === category.id
          );
          if (categoryEntries.length === 0) return null;

          return (
            <div key={category.id}>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {category.label}
              </h4>
              <ul className="space-y-1">
                {categoryEntries.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <li key={entry.type}>
                      <button
                        type="button"
                        onClick={() => onSelect(entry.type)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50"
                      >
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {entry.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.description}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
