const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

export interface GisConfig {
  cesiumIonToken: string;
  defaultCamera: { longitude: number; latitude: number; height: number };
  layersServiceUrl: string;
}

export const gisConfig: GisConfig = {
  cesiumIonToken: env.VITE_CESIUM_ION_TOKEN ?? '',
  defaultCamera: { longitude: 35.0, latitude: 39.0, height: 2_500_000 },
  layersServiceUrl: env.VITE_GIS_LAYERS_URL ?? 'http://localhost:8083/gis/layers',
};
