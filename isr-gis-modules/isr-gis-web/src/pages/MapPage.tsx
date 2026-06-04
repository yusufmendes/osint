import { useEffect, useRef } from "react";
import { Box, Stack, Typography } from "@mui/material";

const layerGroups = [
  {
    title: "Varsayılan Katmanlar",
    rows: [
      "Hava Araçları",
      "Link 3D",
      "Pusula",
      "MGRS Grid",
      "Ölçek",
      "Navigasyon",
    ],
  },
  {
    title: "Genel Katmanlar",
    rows: [
      "test-katman-grup(deneme)",
      "bingwms",
      "adana 2",
      "Varsayılan Harita",
      "Gökyüzü",
    ],
  },
  {
    title: "Veri Katmanları",
    rows: ["AI Eşleme", "Gözlem İzleri", "Alan Sınırları"],
  },
];

const panelCornerRadialBackground = `
  radial-gradient(ellipse 112px 112px at 0px 0px, rgba(126, 227, 255, 0.32) 0%, rgba(126, 227, 255, 0.2) 34%, rgba(126, 227, 255, 0.08) 60%, transparent 84%),
  linear-gradient(180deg, rgba(23, 42, 50, 0.64), rgba(5, 13, 18, 0.54))
`;
const layerHeaderCornerRadialBackground = `
  radial-gradient(ellipse 112px 112px at 0px 0px, rgba(126, 227, 255, 0.32) 0%, rgba(126, 227, 255, 0.2) 34%, rgba(126, 227, 255, 0.08) 60%, transparent 84%),
  linear-gradient(90deg, rgba(126, 227, 255, 0.12), rgba(126, 227, 255, 0.025))
`;
const toolItems = [
  { kind: "chevron", label: "UP", active: true, wide: true },
  { kind: "plus", label: "ZOOM IN" },
  { kind: "minus", label: "ZOOM OUT" },
  { kind: "layers", label: "LAYERS", active: true },
  { kind: "search", label: "SEARCH" },
  { kind: "calendar", label: "TIME" },
  { kind: "route", label: "ROUTE" },
  { kind: "globe", label: "WORLD" },
  { kind: "list", label: "LIST" },
  { kind: "text", label: "m ft" },
  { kind: "pin", label: "PIN" },
  { kind: "cursor", label: "CURSOR", active: true },
  { kind: "text", label: "MA" },
  { kind: "chain", label: "LINK" },
  { kind: "refresh", label: "SYNC" },
  { kind: "camera", label: "CAM" },
  { kind: "text", label: "2D" },
  { kind: "text", label: "3D" },
  { kind: "terrain", label: "TERRAIN" },
  { kind: "search", label: "FOCUS", active: true },
  { kind: "air", label: "AIR" },
];
const addLayerTools = ["DMZ", "IMG", "PIN", "LAYER", "AIR", "MUX"];
type CesiumViewerHandle = {
  destroy: () => void;
  isDestroyed: () => boolean;
};

function ToolStripIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "chevron":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 14 12 8l6 6" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "minus":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M8 12h8" />
        </svg>
      );
    case "layers":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8.5 12 4l8 4.5-8 4.5Z" />
          <path d="M4 12.5 12 17l8-4.5M4 16.5 12 21l8-4.5" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="m15 15 4.5 4.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 7h14v12H5Z" />
          <path d="M8 4v5M16 4v5M5 11h14" />
        </svg>
      );
    case "route":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="7" cy="7" r="2" />
          <circle cx="17" cy="17" r="2" />
          <path d="M9 7h3.5a3 3 0 0 1 0 6H11a3 3 0 0 0 0 6h4" />
        </svg>
      );
    case "globe":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
        </svg>
      );
    case "list":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 7h12M6 12h12M6 17h12" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      );
    case "cursor":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4 18 20l-7-3-5 3Z" />
        </svg>
      );
    case "chain":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9.5 8H8a4 4 0 0 0 0 8h3M14.5 8H16a4 4 0 0 1 0 8h-3M9 12h6" />
        </svg>
      );
    case "refresh":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a7 7 0 1 0 1 7M18 8V4M18 8h-4" />
        </svg>
      );
    case "camera":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8h4l1.5-2h5L16 8h4v10H4Z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "terrain":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 19h18L15 8l-4 7-2-4Z" />
          <path d="M15 8 12.8 12h4.4" />
        </svg>
      );
    case "air":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 19 20l-7-3-7 3Z" />
          <path d="M12 3v14" />
        </svg>
      );
    default:
      return null;
  }
}

function LayerRow({
  label,
  muted = false,
}: {
  label: string;
  muted?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "14px 1fr",
        alignItems: "center",
        gap: 0.75,
        minHeight: 20,
        color: muted ? "rgba(211, 231, 238, 0.58)" : "rgba(225, 242, 246, 0.9)",
        fontSize: 12,
        lineHeight: 1.15,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: 10,
          height: 10,
          borderRadius: 0.5,
          border: "1px solid rgba(126, 227, 255, 0.62)",
          boxShadow: "inset 0 0 0 2px rgba(9, 24, 32, 0.95)",
          bgcolor: muted ? "transparent" : "rgba(50, 238, 171, 0.62)",
        }}
      />
      <span>{label}</span>
    </Box>
  );
}

function canUseWebGl() {
  if (import.meta.env.MODE === "test") {
    return false;
  }

  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }

  const getContext = window.HTMLCanvasElement?.prototype.getContext;

  if (
    !getContext ||
    !Function.prototype.toString.call(getContext).includes("[native code]")
  ) {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function CesiumGlobe() {
  const cesiumContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = cesiumContainerRef.current;

    if (!container || !canUseWebGl()) {
      return undefined;
    }

    let viewer: CesiumViewerHandle | undefined;
    let isDisposed = false;

    void import("./createCesiumViewer")
      .then(({ createCesiumViewer }) => {
        if (isDisposed || !container.isConnected) {
          return;
        }

        viewer = createCesiumViewer(container);
      })
      .catch((error: unknown) => {
        console.error("Cesium globe failed to initialize.", error);
      });

    return () => {
      isDisposed = true;
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  return (
    <Box
      ref={cesiumContainerRef}
      data-testid="gis-cesium-globe"
      data-globe-theme="cyan-command"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        bgcolor: "#02090d",
        "& .cesium-viewer, & .cesium-viewer-cesiumWidgetContainer, & .cesium-widget": {
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        },
        "& .cesium-widget canvas": {
          display: "block",
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          outline: "none",
        },
        "& .cesium-viewer-bottom": {
          position: "absolute",
          left: 14,
          bottom: 10,
          color: "rgba(215, 240, 247, 0.64)",
          textShadow: "0 0 8px rgba(0, 0, 0, 0.9)",
        },
        "& .cesium-credit-logoContainer img": {
          height: 20,
        },
      }}
    />
  );
}

export default function MapPage() {
  return (
    <Box
      data-testid="gis-map-surface"
      data-map-engine="cesiumjs"
      data-imagery="cyan-command-world-map"
      data-map-tone="cyan-command-globe"
      sx={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        bgcolor: "#02090d",
        color: "#d9eef4",
      }}
    >
      <CesiumGlobe />

      <Stack
        data-testid="gis-tool-strip"
        data-visual-style="tactical-neomorphic"
        data-hover-model="left-rail-orb-hover"
        data-radial-model="corner-panel-radial"
        data-radial-source="top-left-panel-corner"
        data-radial-size="112x112"
        sx={{
          position: "absolute",
          right: 18,
          top: 52,
          zIndex: 3,
          width: 64,
          px: 0.45,
          py: 0.7,
          display: "grid",
          gridTemplateColumns: "repeat(2, 26px)",
          justifyContent: "center",
          columnGap: 0.35,
          rowGap: 0.32,
          borderRadius: 2,
          bgcolor: "rgba(8, 18, 23, 0.56)",
          backgroundImage: panelCornerRadialBackground,
          border: "1px solid rgba(126, 227, 255, 0.16)",
          boxShadow:
            "14px 18px 34px rgba(0,0,0,0.32), inset 1px 1px 2px rgba(255,255,255,0.045), inset -4px -5px 12px rgba(0,0,0,0.34)",
          backdropFilter: "blur(14px) saturate(1.05)",
          "& svg": {
            width: 23,
            height: 23,
            overflow: "visible",
          },
          "& svg path, & svg circle": {
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.8,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            vectorEffect: "non-scaling-stroke",
          },
        }}
      >
        {toolItems.map((item, index) => (
          <Box
            key={`${item.kind}-${item.label}-${index}`}
            data-testid="gis-tool-strip-icon"
            data-hover-model="left-rail-orb-hover"
            title={item.label}
            sx={{
              gridColumn: item.wide ? "1 / -1" : "auto",
              width: item.wide ? "100%" : 26,
              height: item.kind === "text" ? 22 : 27,
              display: "grid",
              placeItems: "center",
              color: item.active ? "#f0d247" : "rgba(126, 227, 255, 0.72)",
              fontSize: item.label.length > 2 ? 12 : 13,
              fontWeight: 900,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: 0,
              borderRadius: 1,
              bgcolor: item.active ? "rgba(126, 227, 255, 0.1)" : "rgba(5, 13, 18, 0.16)",
              border: item.active
                ? "1px solid rgba(240, 210, 71, 0.26)"
                : "1px solid rgba(126, 227, 255, 0.08)",
              boxShadow: item.active
                ? "0 0 16px rgba(126, 227, 255, 0.12), inset 0 0 12px rgba(126, 227, 255, 0.05)"
                : "inset 1px 1px 2px rgba(255,255,255,0.025), inset -2px -2px 5px rgba(0,0,0,0.24)",
              textShadow: item.active
                ? "0 0 9px rgba(240, 210, 71, 0.3)"
                : "0 0 8px rgba(0, 0, 0, 0.55)",
              transition:
                "background-color 120ms ease, color 120ms ease, border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease",
              "&:hover": {
                color: "#f2fbff",
                bgcolor: "rgba(126, 227, 255, 0.1)",
                borderColor: "rgba(126, 227, 255, 0.34)",
                boxShadow:
                  "0 0 22px rgba(126, 227, 255, 0.18), inset 0 0 16px rgba(126, 227, 255, 0.06)",
                transform: "translateY(-1px)",
              },
            }}
          >
            {item.kind === "text" ? (
              item.label
            ) : (
              <ToolStripIcon kind={item.kind} />
            )}
          </Box>
        ))}
      </Stack>

      <Box
        data-testid="gis-layer-manager"
        data-visual-style="tactical-neomorphic"
        data-surface-family="command-glass"
        data-radial-model="corner-panel-radial"
        data-radial-source="top-left-panel-corner"
        data-radial-size="112x112"
        sx={{
          position: "absolute",
          right: 86,
          top: 82,
          zIndex: 4,
          width: { xs: 286, md: 330 },
          color: "#e5f2f5",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "rgba(8, 18, 23, 0.58)",
          backgroundImage: panelCornerRadialBackground,
          border: "1px solid rgba(126, 227, 255, 0.16)",
          boxShadow:
            "14px 18px 34px rgba(0,0,0,0.34), inset 1px 1px 2px rgba(255,255,255,0.05), inset -5px -6px 14px rgba(0,0,0,0.36)",
          backdropFilter: "blur(14px) saturate(1.05)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.8,
            bgcolor: "rgba(5, 13, 18, 0.3)",
            backgroundImage: layerHeaderCornerRadialBackground,
            borderBottom: "1px solid rgba(126, 227, 255, 0.18)",
          }}
        >
          <Box sx={{ width: 18, height: 18, color: "#7ee3ff" }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 7.5 12 3l9 4.5-9 4.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M3 12 12 16.5 21 12M3 16.5 12 21l9-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </Box>
          <Typography
            sx={{
              color: "#f2fbff",
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: 0,
              textShadow: "0 0 12px rgba(126, 227, 255, 0.14)",
            }}
          >
            KATMAN YÖNETİCİSİ
          </Typography>
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              gap: 0.8,
              color: "rgba(126, 227, 255, 0.72)",
              fontWeight: 900,
            }}
          >
            <span>-</span>
            <span>x</span>
          </Box>
        </Box>

        <Stack
          spacing={0.7}
          sx={{
            p: 1.1,
            maxHeight: 344,
            overflow: "hidden",
            backgroundImage:
              "radial-gradient(circle at 100% 0%, rgba(240, 210, 71, 0.055), transparent 30%)",
          }}
        >
          {layerGroups.map((group) => (
            <Box
              key={group.title}
              sx={{
                borderRadius: 1,
                px: 0.8,
                py: 0.65,
                bgcolor: "rgba(5, 13, 18, 0.18)",
                border: "1px solid rgba(126, 227, 255, 0.08)",
                boxShadow:
                  "inset 1px 1px 2px rgba(255,255,255,0.025), inset -2px -3px 8px rgba(0,0,0,0.2)",
              }}
            >
              <Typography
                sx={{
                  color: "#f0d247",
                  fontSize: 13,
                  fontWeight: 900,
                  mb: 0.45,
                  textShadow: "0 0 10px rgba(240, 210, 71, 0.16)",
                }}
              >
                ▾ {group.title}
              </Typography>
              <Stack spacing={0.35} sx={{ pl: 0.6 }}>
                {group.rows.map((row, index) => (
                  <LayerRow
                    key={row}
                    label={row}
                    muted={
                      index === 3 && group.title === "Varsayılan Katmanlar"
                    }
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 0.5,
            px: 1,
            py: 0.8,
            bgcolor: "rgba(5, 13, 18, 0.32)",
            backgroundImage:
              "linear-gradient(90deg, rgba(126, 227, 255, 0.04), rgba(240, 210, 71, 0.035))",
            borderTop: "1px solid rgba(126, 227, 255, 0.14)",
          }}
        >
          {addLayerTools.map((tool) => (
            <Box
              key={tool}
              sx={{
                height: 28,
                display: "grid",
                placeItems: "center",
                color: tool === "DMZ" ? "#f0d247" : "#31efb0",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 9,
                fontWeight: 900,
                borderRadius: 1,
                border: "1px solid rgba(126, 227, 255, 0.16)",
                bgcolor: "rgba(8, 18, 23, 0.38)",
                boxShadow:
                  "inset 1px 1px 2px rgba(255,255,255,0.04), inset -2px -3px 7px rgba(0,0,0,0.3)",
                textShadow: "0 0 9px rgba(126, 227, 255, 0.18)",
              }}
            >
              {tool}
            </Box>
          ))}
        </Box>
      </Box>

    </Box>
  );
}
