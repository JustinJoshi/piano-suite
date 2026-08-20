"use client";

import { MidiConnectionBar } from "@/components/drills/midi-connection-bar";
import { useMidi } from "@/hooks/useMidi";
import type { MidiConnectionBarConfig } from "@/lib/feature-blocks/midi-connection-bar/config";

export function MidiConnectionBarBlock(config: MidiConnectionBarConfig) {
  const { supported, connected, error, inputs, selectedInputId, setSelectedInputId, connect } =
    useMidi();

  return (
    <div className={config.compact ? "text-xs" : ""}>
      <MidiConnectionBar
        supported={supported}
        connected={connected}
        error={error}
        inputs={inputs}
        selectedInputId={selectedInputId}
        onSelectInput={setSelectedInputId}
        onConnect={connect}
      />
    </div>
  );
}
