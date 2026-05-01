import { useSelector } from 'react-redux';
import type { RootState } from 'osint-web-core';

interface GisLike { dummy: string; layers: { id: string; name: string; visible: boolean }[] }

export default function LayersPage() {
  const gis = useSelector((s: RootState) => (s as unknown as { gis: GisLike }).gis);
  return (
    <section style={{ padding: 24 }}>
      <h1>GIS Layers</h1>
        <p>dummy: {gis.dummy}</p>
      {gis.layers.length === 0
        ? <p>No layers yet.</p>
        : <ul>{gis.layers.map((l) => <li key={l.id}>{l.name} {l.visible ? '(visible)' : '(hidden)'}</li>)}</ul>}
    </section>
  );
}
