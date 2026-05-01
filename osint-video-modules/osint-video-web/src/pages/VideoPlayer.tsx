import { useSelector } from 'react-redux';
import type { RootState } from 'osint-web-core';
import { useIntelligenceQuery } from 'osint-intelligence-web';

interface ShellLike { dummy: string }
interface ModuleLike { dummy: string }

export default function VideoPlayer() {
  const root = useSelector((s: RootState) => s as unknown as {
    shell: ShellLike;
    gis: ModuleLike;
    video: ModuleLike;
    intelligence: ModuleLike;
    search: ModuleLike;
  });

  const intel = useIntelligenceQuery({ pageSize: 5 });

  return (
    <section style={{ padding: 24 }}>
      <h1>
        Hello {root.shell.dummy} + {root.gis.dummy} + {root.video.dummy} + {root.intelligence.dummy} + {root.search.dummy}
      </h1>
      <h2>Video Player</h2>
      <p>HLS player skeleton — empty scaffold.</p>
      {intel.data && <p>Cross-module: intelligence total {intel.data.total}</p>}
    </section>
  );
}
