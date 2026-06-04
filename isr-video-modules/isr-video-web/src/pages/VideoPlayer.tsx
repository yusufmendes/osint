import { Box, Stack, Typography } from '@mui/material';

export interface VideoSurfacePageProps {
  provider?: 'ANKAS' | 'BAYKAR' | 'GÖZCÜ';
  source?: string;
}

export default function VideoPlayer({ provider = 'ANKAS', source = 'ANKA-1' }: VideoSurfacePageProps) {
  return (
    <Box
      data-testid="video-surface-page"
      sx={{
        minHeight: 'calc(100vh - 132px)',
        p: { xs: 2, md: 4 },
        color: '#dceef3',
        bgcolor: '#0b151b',
        background:
          'radial-gradient(circle at 28% 18%, rgba(126, 227, 255, 0.1), transparent 28%), linear-gradient(135deg, #0b151b, #101f27)',
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography sx={{ color: '#f0d247', fontSize: 12, fontWeight: 800, letterSpacing: 0 }}>
            {provider} CANLI VİDEO
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.4, fontWeight: 900, letterSpacing: 0 }}>
            {source}
          </Typography>
        </Box>

        <Box
          sx={{
            height: { xs: 320, md: 540 },
            maxWidth: 1120,
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#03070a',
            border: '1px solid rgba(126, 227, 255, 0.18)',
            boxShadow:
              '18px 24px 48px rgba(0, 0, 0, 0.52), inset 2px 2px 5px rgba(255,255,255,0.045), inset -8px -10px 18px rgba(0,0,0,0.64)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(126, 227, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(126, 227, 255, 0.05) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 28,
              border: '1px solid rgba(126, 227, 255, 0.28)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Typography sx={{ color: 'rgba(220, 238, 243, 0.68)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              VIDEO PLACEHOLDER / {source}
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              left: 22,
              top: 18,
              color: '#31efb0',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            LINK: STANDBY
          </Box>
          <Box
            sx={{
              position: 'absolute',
              right: 22,
              bottom: 18,
              color: '#f0d247',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            SENSOR: {provider}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
