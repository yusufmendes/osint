import { useSelector } from 'react-redux';
import { List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import type { RootState } from 'isr-web-core';

const SAMPLE_LAYERS = [
  { id: 'osm',       name: 'OpenStreetMap (base)' },
  { id: 'sat',       name: 'Satellite imagery' },
  { id: 'overlay-1', name: 'Operational overlay #1' },
];

export default function LayersPage() {
  const shell  = useSelector((s: RootState) => (s as any).shell.dummy);
  const gis    = useSelector((s: RootState) => (s as any).gis.dummy);
  const video  = useSelector((s: RootState) => (s as any).video.dummy);
  const intel  = useSelector((s: RootState) => (s as any).intelligence.dummy);
  const search = useSelector((s: RootState) => (s as any).search.dummy);

  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <Typography variant="h4">GIS / Katmanlar</Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">
          Merhaba {shell} + {gis} + {video} + {intel} + {search}
        </Typography>
      </Paper>
      <Paper>
        <List dense>
          {SAMPLE_LAYERS.map((l) => (
            <ListItem key={l.id} divider>
              <ListItemText primary={l.name} secondary={l.id} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}
