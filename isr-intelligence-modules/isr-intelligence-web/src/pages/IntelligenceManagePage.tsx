import { Box, Stack, Typography } from '@mui/material';

const rows = [
  ['INT-2401', 'Saha temas özeti', 'Açık'],
  ['INT-2402', 'Hava izi korelasyonu', 'İncelemede'],
  ['INT-2403', 'Kaynak güvenilirlik notu', 'Arşiv'],
];

export default function IntelligenceManagePage() {
  return (
    <Box
      data-testid="intelligence-manage-page"
      sx={{
        minHeight: 'calc(100vh - 132px)',
        p: { xs: 2, md: 4 },
        bgcolor: '#0b151b',
        color: '#dceef3',
      }}
    >
      <Stack spacing={2.5} sx={{ maxWidth: 980 }}>
        <Box>
          <Typography sx={{ color: '#f0d247', fontSize: 12, fontWeight: 800, letterSpacing: 0 }}>
            İSTİHBARAT VERİ YÖNETİMİ
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.4, fontWeight: 900, letterSpacing: 0 }}>
            İstihbarat Yönet
          </Typography>
        </Box>

        <Box
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: 'rgba(18, 31, 38, 0.88)',
            border: '1px solid rgba(126, 227, 255, 0.18)',
            boxShadow:
              '14px 18px 32px rgba(0, 0, 0, 0.44), inset 2px 2px 5px rgba(255,255,255,0.055), inset -5px -6px 12px rgba(0,0,0,0.42)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 130px',
              px: 2,
              py: 1.2,
              bgcolor: 'rgba(5, 12, 16, 0.82)',
              color: '#f0d247',
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            <span>Kayıt</span>
            <span>Başlık</span>
            <span>Durum</span>
          </Box>
          {rows.map(([id, title, status]) => (
            <Box
              key={id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 130px',
                px: 2,
                py: 1.3,
                borderTop: '1px solid rgba(126, 227, 255, 0.11)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 13,
              }}
            >
              <span>{id}</span>
              <span>{title}</span>
              <span>{status}</span>
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
