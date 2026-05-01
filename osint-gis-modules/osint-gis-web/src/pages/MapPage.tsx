import { useSelector } from 'react-redux';
import type { RootState } from 'osint-web-core';
import { useIntelligenceQuery } from 'osint-intelligence-web';

interface ShellLike { dummy: string }
interface ModuleLike { dummy: string }

export default function MapPage() {
  const root = useSelector((s: RootState) => s as unknown as {
    shell: ShellLike;
    gis: ModuleLike;
    video: ModuleLike;
    intelligence: ModuleLike;
    search: ModuleLike;
  });

  // Cross-module hook: GIS page consumes the Intelligence query hook.
  // A single QueryClient in the shell means cache sharing is automatic.
  const intel = useIntelligenceQuery({ pageSize: 5 });

  return (
    <section style={{ padding: 24 }}>
      <h1>
        Hello {root.shell.dummy} + {root.gis.dummy} + {root.video.dummy} + {root.intelligence.dummy} + {root.search.dummy}
      </h1>
      <h2>GIS Map (CesiumJS placeholder)</h2>
      <p>
        In production this area will render with a Cesium `Viewer`.
        In the empty scaffold only SDK packages were added to `package.json`.
      </p>
      <h3>Intelligence (via cross-module hook)</h3>
      {intel.isLoading && <p>Loading...</p>}
      {intel.isError && <p style={{ color: 'crimson' }}>Error: {String(intel.error)}</p>}
      {intel.data && <p>Total intelligence: {intel.data.total}</p>}
    </section>
  );
}
