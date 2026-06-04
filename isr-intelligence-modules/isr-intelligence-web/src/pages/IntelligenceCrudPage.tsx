import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { RootState } from 'isr-web-core';
import { useIntelligenceQuery } from '../hooks/useIntelligenceQuery';
import { useDeleteIntelligence } from '../hooks/useDeleteIntelligence';
import { intelligenceApi } from '../api/intelligenceApi';
import { useQueryClient } from '@tanstack/react-query';

export default function IntelligenceCrudPage() {
  const shell  = useSelector((s: RootState) => (s as any).shell.dummy);
  const gis    = useSelector((s: RootState) => (s as any).gis.dummy);
  const video  = useSelector((s: RootState) => (s as any).video.dummy);
  const intel  = useSelector((s: RootState) => (s as any).intelligence.dummy);
  const search = useSelector((s: RootState) => (s as any).search.dummy);

  const list = useIntelligenceQuery({ limit: 50 });
  const del = useDeleteIntelligence();
  const qc = useQueryClient();

  const [header, setHeader] = useState('');
  const [description, setDescription] = useState('');

  const create = async () => {
    if (!header) return;
    await intelligenceApi.create({ header, description, templateId: 'tpl-default' });
    setHeader('');
    setDescription('');
    await qc.invalidateQueries({ queryKey: ['intelligence'] });
  };

  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <Typography variant="h4">Intelligence / CRUD</Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">
          Merhaba {shell} + {gis} + {video} + {intel} + {search}
        </Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Header"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ flex: 2 }}
          />
          <Button variant="contained" onClick={create}>
            Yarat
          </Button>
        </Stack>
      </Paper>

      <Paper>
        {list.isLoading && <Box sx={{ p: 2 }}>Loading...</Box>}
        {list.isError && <Box sx={{ p: 2, color: 'error.main' }}>Error: {String(list.error)}</Box>}
        {list.data && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Header</TableCell>
                <TableCell>Description</TableCell>
                <TableCell width={100}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.header}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => del.mutate(row.id)}
                      aria-label={`delete ${row.id}`}
                    >
                      x
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
