import {
  buildModuleUrl,
  Cartesian3,
  Color,
  CustomDataSource,
  ImageryLayer,
  Ion,
  PolylineGlowMaterialProperty,
  PostProcessStage,
  Resource,
  TileMapServiceImageryProvider,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import { gisConfig } from "../config";

const cesiumAssetsBaseUrl = new URL(
  ["..", "..", "node_modules", "cesium", "Build", "Cesium", ""].join("/"),
  import.meta.url,
).toString();
const countryBordersUrl =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const commandCyanHot = Color.fromCssColorString("#25f4ff");
const commandCyanCore = Color.fromCssColorString("#9afcff");
const countryBorderHeight = 32_000;
export const cesiumInteractionPerformanceProfile = {
  name: "interaction-light",
  resolutionScale: 0.66,
  targetFrameRate: 24,
  enableFxaa: false,
  enablePostProcessTone: true,
  enablePostProcessToneDuringInteraction: false,
  postProcessRestoreDelayMs: 220,
  enableGlowBorders: false,
  countryBorderWidth: 2.2,
} as const;

export const cesiumViewerPerformanceOptions = {
  contextOptions: {
    allowTextureFilterAnisotropic: false,
    webgl: {
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    },
  },
  maximumRenderTimeChange: Number.POSITIVE_INFINITY,
  msaaSamples: 1,
  orderIndependentTranslucency: false,
  requestRenderMode: true,
  scene3DOnly: true,
  skyAtmosphere: false,
  skyBox: false,
  targetFrameRate: cesiumInteractionPerformanceProfile.targetFrameRate,
  useBrowserRecommendedResolution: true,
} satisfies NonNullable<ConstructorParameters<typeof Viewer>[1]>;
const cyanCommandGlobeShader = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

void main(void) {
  vec4 source = texture(colorTexture, v_textureCoordinates);
  float luminance = dot(source.rgb, vec3(0.299, 0.587, 0.114));
  float blueGreen = clamp((source.g * 0.46 + source.b * 0.72) - source.r * 0.2, 0.0, 1.0);
  float surfaceMask = smoothstep(0.018, 0.18, luminance);

  vec3 voidBlue = vec3(0.0, 0.006, 0.018);
  vec3 deepSea = vec3(0.008, 0.084, 0.108);
  vec3 mutedLand = vec3(0.052, 0.28, 0.32);
  vec3 electricCyan = vec3(0.46, 0.96, 1.0);

  vec3 mapped = mix(voidBlue, deepSea, surfaceMask);
  mapped = mix(mapped, mutedLand, smoothstep(0.18, 0.72, luminance) * 0.72);
  mapped += electricCyan * blueGreen * 0.26;
  mapped += electricCyan * smoothstep(0.52, 0.92, luminance) * 0.72;
  mapped = min(mapped * 1.18, vec3(1.0));

  out_FragColor = vec4(mapped, source.a);
}
`;

type BuildModuleUrlWithBase = typeof buildModuleUrl & {
  setBaseUrl: (value: string) => void;
};

type GeoJsonPosition = [longitude: number, latitude: number, altitude?: number];
type GeoJsonLinearRing = GeoJsonPosition[];
type GeoJsonPolygon = GeoJsonLinearRing[];
type GeoJsonMultiPolygon = GeoJsonPolygon[];
type CountryBoundaryGeometry =
  | { type: "Polygon"; coordinates: GeoJsonPolygon }
  | { type: "MultiPolygon"; coordinates: GeoJsonMultiPolygon };
type CountryBoundaryFeature = {
  geometry: CountryBoundaryGeometry | null;
};
type CountryBoundaryFeatureCollection = {
  features?: CountryBoundaryFeature[];
};
type CesiumMoveEvent = {
  addEventListener: (listener: () => void) => () => void;
};
type InteractionAwarePostProcessViewer = {
  camera: {
    moveStart: CesiumMoveEvent;
    moveEnd: CesiumMoveEvent;
  };
  isDestroyed: () => boolean;
  scene: {
    requestRender: () => void;
  };
};
type InteractionAwarePostProcessStage = {
  enabled: boolean;
};

function configureCesiumAssetBaseUrl() {
  (buildModuleUrl as BuildModuleUrlWithBase).setBaseUrl(cesiumAssetsBaseUrl);
}

function addCyanCommandPostProcess(viewer: Viewer) {
  const stage = new PostProcessStage({
    fragmentShader: cyanCommandGlobeShader,
    name: "isr-cyan-command-globe-tone",
  });
  viewer.scene.postProcessStages.add(stage);
  return stage;
}

export function attachInteractionAwarePostProcessTone(
  viewer: InteractionAwarePostProcessViewer,
  stage: InteractionAwarePostProcessStage,
) {
  let restoreTimer: ReturnType<typeof setTimeout> | undefined;

  const clearRestoreTimer = () => {
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = undefined;
    }
  };

  const setStageEnabled = (enabled: boolean) => {
    if (viewer.isDestroyed() || stage.enabled === enabled) {
      return;
    }

    stage.enabled = enabled;
    viewer.scene.requestRender();
  };

  const disableDuringInteraction = () => {
    clearRestoreTimer();
    setStageEnabled(false);
  };

  const restoreAfterInteraction = () => {
    clearRestoreTimer();
    restoreTimer = setTimeout(() => {
      restoreTimer = undefined;
      setStageEnabled(true);
    }, cesiumInteractionPerformanceProfile.postProcessRestoreDelayMs);
  };

  const removeMoveStartListener = viewer.camera.moveStart.addEventListener(
    disableDuringInteraction,
  );
  const removeMoveEndListener = viewer.camera.moveEnd.addEventListener(restoreAfterInteraction);

  return () => {
    clearRestoreTimer();
    removeMoveStartListener();
    removeMoveEndListener();
  };
}

function isValidCoordinate(position: GeoJsonPosition) {
  return Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

function toRaisedDegrees(ring: GeoJsonLinearRing) {
  return ring.filter(isValidCoordinate).flatMap(([longitude, latitude]) => [
    longitude,
    latitude,
    countryBorderHeight,
  ]);
}

function addBorderRing(dataSource: CustomDataSource, ring: GeoJsonLinearRing) {
  const raisedDegrees = toRaisedDegrees(ring);

  if (raisedDegrees.length < 9) {
    return;
  }

  const positions = Cartesian3.fromDegreesArrayHeights(raisedDegrees);

  if (cesiumInteractionPerformanceProfile.enableGlowBorders) {
    dataSource.entities.add({
      polyline: {
        clampToGround: false,
        material: new PolylineGlowMaterialProperty({
          color: commandCyanHot.withAlpha(0.92),
          glowPower: 0.26,
          taperPower: 1,
        }),
        positions,
        width: 7,
      },
    });
  }

  dataSource.entities.add({
    polyline: {
      clampToGround: false,
      material: commandCyanCore.withAlpha(0.88),
      positions,
      width: cesiumInteractionPerformanceProfile.countryBorderWidth,
    },
  });
}

function addBoundaryGeometry(dataSource: CustomDataSource, geometry: CountryBoundaryGeometry) {
  if (geometry.type === "Polygon") {
    const exteriorRing = geometry.coordinates[0];
    if (exteriorRing) {
      addBorderRing(dataSource, exteriorRing);
    }
    return;
  }

  geometry.coordinates.forEach((polygon) => {
    const exteriorRing = polygon[0];
    if (exteriorRing) {
      addBorderRing(dataSource, exteriorRing);
    }
  });
}

async function loadCyanCountryBorders(viewer: Viewer) {
  const countryBorders = new CustomDataSource("Cyan command country borders");
  const geoJson = (await Resource.fetchJson({
    url: countryBordersUrl,
  })) as CountryBoundaryFeatureCollection | undefined;

  geoJson?.features?.forEach((feature) => {
    if (feature.geometry) {
      addBoundaryGeometry(countryBorders, feature.geometry);
    }
  });

  await viewer.dataSources.add(countryBorders);
  viewer.scene.requestRender();
}

function addCyanCountryBorders(viewer: Viewer) {
  void loadCyanCountryBorders(viewer)
    .catch((error: unknown) => {
      console.warn("Cyan country borders could not be loaded.", error);
    });
}

export function createCesiumViewer(container: HTMLElement) {
  if (gisConfig.cesium.ionToken) {
    Ion.defaultAccessToken = gisConfig.cesium.ionToken;
  }

  configureCesiumAssetBaseUrl();

  const naturalEarthLayer = ImageryLayer.fromProviderAsync(
    TileMapServiceImageryProvider.fromUrl(
      buildModuleUrl("Assets/Textures/NaturalEarthII"),
    ),
  );
  naturalEarthLayer.brightness = 0.56;
  naturalEarthLayer.contrast = 1.46;
  naturalEarthLayer.gamma = 0.78;
  naturalEarthLayer.saturation = 0.48;

  const viewer = new Viewer(container, {
    animation: false,
    baseLayer: naturalEarthLayer,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    shouldAnimate: false,
    showRenderLoopErrors: false,
    timeline: false,
    vrButton: false,
    ...cesiumViewerPerformanceOptions,
  });

  viewer.resolutionScale = cesiumInteractionPerformanceProfile.resolutionScale;
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(23, 10, 19_000_000),
    orientation: {
      heading: 0,
      pitch: -Math.PI / 2,
      roll: 0,
    },
  });
  viewer.scene.backgroundColor = Color.fromCssColorString("#000719");
  viewer.scene.globe.baseColor = Color.fromCssColorString("#03161d");
  viewer.scene.globe.enableLighting = false;
  viewer.scene.postProcessStages.fxaa.enabled = cesiumInteractionPerformanceProfile.enableFxaa;
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1_000;
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.hueShift = -0.08;
    viewer.scene.skyAtmosphere.saturationShift = 0.36;
    viewer.scene.skyAtmosphere.brightnessShift = -0.18;
  }

  let detachPostProcessTone: (() => void) | undefined;
  if (cesiumInteractionPerformanceProfile.enablePostProcessTone) {
    const cyanToneStage = addCyanCommandPostProcess(viewer);
    if (!cesiumInteractionPerformanceProfile.enablePostProcessToneDuringInteraction) {
      detachPostProcessTone = attachInteractionAwarePostProcessTone(viewer, cyanToneStage);
    }
  }
  addCyanCountryBorders(viewer);
  viewer.scene.requestRender();

  if (detachPostProcessTone) {
    const destroyViewer = viewer.destroy.bind(viewer);
    viewer.destroy = () => {
      detachPostProcessTone();
      destroyViewer();
    };
  }

  return viewer;
}
