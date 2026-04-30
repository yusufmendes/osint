import { useSelector } from 'react-redux';
import type { RootState } from 'osint-web-core';
import { useIntelligenceQuery } from '../hooks/useIntelligenceQuery';
import { useDeleteIntelligence } from '../hooks/useDeleteIntelligence';

interface ShellLike { dummy: string }
interface ModuleLike { dummy: string }

export default function IntelligenceCrudPage() {
  const root = useSelector((s: RootState) => s as unknown as {
    shell: ShellLike;
    gis: ModuleLike;
    video: ModuleLike;
    intelligence: ModuleLike;
    search: ModuleLike;
  });

  const list = useIntelligenceQuery({ pageSize: 10 });
  const del  = useDeleteIntelligence();

  return (
    <section style={{ padding: 24 }}>
      <h1>
        Merhaba {root.shell.dummy} + {root.gis.dummy} + {root.video.dummy} + {root.intelligence.dummy} + {root.search.dummy}
      </h1>
      <h2>Intelligence CRUD</h2>
      {list.isLoading && <p>Yükleniyor...</p>}
      {list.isError && <p style={{ color: 'crimson' }}>Hata: {String(list.error)}</p>}
      {list.data && (
        <ul>
          {list.data.items.map((it) => (
            <li key={it.id}>
              <strong>{it.header}</strong> &mdash; {it.description}
              {' '}
              <button onClick={() => del.mutate(it.id)} disabled={del.isPending}>
                Sil
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
