import { Alert, Box, Typography } from '@mui/material';

interface Props {
  missing?: string[];
}

export function ForbiddenPage({ missing }: Props) {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>403 — Yetkisiz</Typography>
      <Alert severity="warning">
        Bu sayfayı görüntülemek için yetkiniz yok.
        {missing && missing.length > 0 && (
          <Box mt={1}>
            <strong>Eksik permission'lar:</strong> {missing.join(', ')}
          </Box>
        )}
      </Alert>
    </Box>
  );
}
