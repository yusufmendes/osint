import 'osint-web-core';
import type { ShellState } from './shellSlice';
import type { GisState } from 'osint-gis-web';
import type { VideoState } from 'osint-video-web';
import type { IntelligenceState } from 'osint-intelligence-web';
import type { SearchState } from 'osint-search-web';

declare module 'osint-web-core' {
  interface AppRootStateSchema {
    shell: ShellState;
    gis: GisState;
    video: VideoState;
    intelligence: IntelligenceState;
    search: SearchState;
  }
}

export {};
