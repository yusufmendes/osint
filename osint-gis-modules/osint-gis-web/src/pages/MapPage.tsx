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

  // Cross-module hook: GIS sayfası Intelligence query hook'unu tüketir.
  // QueryClient shell'de tek tane olduğu için cache paylaşımı otomatik.
  const intel = useIntelligenceQuery({ pageSize: 5 });

  return (
    <section style={{ padding: 24 }}>
      <h1>
        Merhaba {root.shell.dummy} + {root.gis.dummy} + {root.video.dummy} + {root.intelligence.dummy} + {root.search.dummy}
      </h1>
      <h2>GIS Map (CesiumJS placeholder)</h2>
      <p>
        Üretim build'inde burası `Viewer` (Cesium) ile render edilecek.
        Boş scaffold'da yalnızca SDK paketleri `package.json`'a eklendi.
      </p>
      <h3>Intelligence (cross-module hook ile)</h3>
      {intel.isLoading && <p>Yükleniyor...</p>}
      {intel.isError && <p style={{ color: 'crimson' }}>Hata: {String(intel.error)}</p>}
      {intel.data && <p>Toplam intelligence: {intel.data.total}</p>}
    </section>
  );
}
