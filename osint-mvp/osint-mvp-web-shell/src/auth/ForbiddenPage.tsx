import { Alert, Box, Typography } from '@mui/material';

interface Props {
  missing?: string[];
}

export function ForbiddenPage({ missing }: Props) {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>403 — Forbidden</Typography>
      <Alert severity="warning">
        You do not have permission to view this page.
        {missing && missing.length > 0 && (
          <Box mt={1}>
            <strong>Missing permissions:</strong> {missing.join(', ')}
          </Box>
        )}
      </Alert>
    </Box>
  );
}
