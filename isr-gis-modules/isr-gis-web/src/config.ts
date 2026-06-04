// Module-local configuration. Centralises behavioural settings AND remote
// service endpoints so callers never reach for env vars directly.
export interface GisConfig {
  remote: {
    tileServer: string;
    elevationServer: string;
  };
  cesium: {
    ionToken?: string;
    defaultCameraHeightMeters: number;
  };
  cache: {
    staleTimeMs: number;
    gcTimeMs: number;
  };
}

export const gisConfig: GisConfig = {
  remote: {
    tileServer: import.meta.env?.VITE_GIS_TILE_SERVER ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    elevationServer:
      import.meta.env?.VITE_GIS_ELEVATION_SERVER ?? 'https://elevation.example.com/v1',
  },
  cesium: {
    ionToken: import.meta.env?.VITE_CESIUM_ION_TOKEN,
    defaultCameraHeightMeters: 12_000_000,
  },
  cache: {
    staleTimeMs: 60_000,
    gcTimeMs: 5 * 60_000,
  },
};
