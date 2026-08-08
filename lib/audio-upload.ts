/**
 * Helpers for coordinating custom kit uploads with IndexedDB storage.
 */

import {
  saveCustomKitBlob,
  deleteCustomKitBlob,
} from "@/lib/audio-storage";
import type { CustomKit } from "@/lib/audio-settings";

export function generateKitId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function saveSf2Kit(
  id: string,
  name: string,
  blob: Blob,
  preset: string
): Promise<CustomKit> {
  await saveCustomKitBlob(id, name, blob);
  return { kind: "sf2", id, name, preset };
}

export async function saveSampleKit(
  kitId: string,
  name: string,
  samples: { note: number; blob: Blob }[]
): Promise<CustomKit> {
  const map: Record<string, string> = {};
  await Promise.all(
    samples.map(async (sample, index) => {
      const sampleId = `${kitId}-${index}`;
      await saveCustomKitBlob(sampleId, `${name} #${index}`, sample.blob);
      map[String(sample.note)] = sampleId;
    })
  );
  return { kind: "samples", id: kitId, name, map };
}

export async function deleteCustomKit(kit: CustomKit): Promise<void> {
  if (kit.kind === "sf2") {
    await deleteCustomKitBlob(kit.id);
  } else {
    await Promise.all(
      Object.values(kit.map).map((sampleId) => deleteCustomKitBlob(sampleId))
    );
    await deleteCustomKitBlob(kit.id);
  }
}
