"use client";

import { MusicPlayer } from "@/components/music-player/music-player";
import {
  normalizeSongPlayerConfig,
  type SongPlayerConfig,
} from "@/lib/feature-blocks/song-player/config";

type SongPlayerBlockProps = Partial<SongPlayerConfig> & {
  /** Position of the block on the page; read-only, never spread onto the DOM. */
  blockId?: string;
};

/**
 * Song player block: the existing music player demoted into a Workshop tile.
 * Consumes the root MusicPlayerProvider via useMusicPlayer() inside
 * <MusicPlayer /> — this block never mounts a provider of its own.
 */
export function SongPlayerBlock({
  // blockId arrives from the renderer but this block is neither a runtime
  // source nor target; it is intentionally unused and never spread to the DOM.
  showUpload,
  startPaused,
}: SongPlayerBlockProps) {
  const config = normalizeSongPlayerConfig({ showUpload, startPaused });

  return (
    <div className="space-y-2 p-2" data-testid="song-player-block">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Song player
      </div>
      <MusicPlayer
        showUpload={config.showUpload}
        autoPlayOnLoad={!config.startPaused}
      />
    </div>
  );
}
