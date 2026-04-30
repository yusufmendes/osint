import { gisModule } from 'osint-gis-web';
import { intelligenceModule } from 'osint-intelligence-web';
import { videoModule } from 'osint-video-web';
import { searchModule } from 'osint-search-web';
import type { AppModule } from 'osint-web-core';

export const allModules: AppModule[] = [
  gisModule,
  intelligenceModule,
  videoModule,
  searchModule,
];
