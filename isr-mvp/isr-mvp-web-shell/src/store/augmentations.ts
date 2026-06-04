/* eslint-disable @typescript-eslint/no-empty-object-type */
import 'isr-web-core';
import type { ShellState } from './shellSlice';
import type { GisState } from 'isr-gis-web';
import type { VideoState } from 'isr-video-web';
import type { IntelligenceState } from 'isr-intelligence-web';
import type { SearchState } from 'isr-search-web';

declare module 'isr-web-core' {
  interface AppRootStateSchema {
    shell: ShellState;
    gis: GisState;
    video: VideoState;
    intelligence: IntelligenceState;
    search: SearchState;
  }
}
