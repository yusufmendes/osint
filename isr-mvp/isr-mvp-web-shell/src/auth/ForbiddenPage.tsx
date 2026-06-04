import { Alert, AlertTitle, Box, Stack, Typography } from '@mui/material';

export function ForbiddenPage({ missing }: { missing: string[] }) {
  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={2} maxWidth={640}>
        <Typography variant="h4">403 - Forbidden</Typography>
        <Alert severity="warning">
          <AlertTitle>Yetersiz yetki</AlertTitle>
          Bu sayfayı görüntülemek için aşağıdaki yetki(ler) gerekli:
          <ul>
            {missing.map((p) => (
              <li key={p}>
                <code>{p}</code>
              </li>
            ))}
          </ul>
        </Alert>
      </Stack>
    </Box>
  );
}
