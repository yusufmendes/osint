import type { AppModule } from 'isr-web-core';
import { gisModule } from 'isr-gis-web';
import { videoModule } from 'isr-video-web';
import { intelligenceModule } from 'isr-intelligence-web';
import { searchModule } from 'isr-search-web';

export const allModules: AppModule[] = [
  gisModule,
  intelligenceModule,
  videoModule,
  searchModule,
];
