import { Box, Stack, TextField, Typography } from '@mui/material';

const suggestionRows = ['Uydu telemetri izi', 'Saha olay raporu', 'Radar temas kaydı', 'Video kaynak etiketi'];

export default function SearchPage() {
  return (
    <Box
      data-testid="search-page-shell"
      sx={{
        minHeight: 'calc(100vh - 132px)',
        p: { xs: 2, md: 4 },
        color: '#dceef3',
        bgcolor: '#0b151b',
        backgroundImage:
          'linear-gradient(rgba(126, 227, 255, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(126, 227, 255, 0.045) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <Stack spacing={2.5} sx={{ maxWidth: 980 }}>
        <Box>
          <Typography sx={{ fontSize: 12, color: '#f0d247', fontWeight: 800, letterSpacing: 0 }}>
            ÇOK ALANLI ARAMA
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.4, fontWeight: 900, letterSpacing: 0 }}>
            Arama
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            maxWidth: 680,
            borderRadius: 2,
            bgcolor: 'rgba(18, 31, 38, 0.86)',
            border: '1px solid rgba(126, 227, 255, 0.18)',
            boxShadow:
              '14px 18px 32px rgba(0, 0, 0, 0.44), inset 2px 2px 5px rgba(255,255,255,0.055), inset -5px -6px 12px rgba(0,0,0,0.42)',
          }}
        >
          <TextField
            fullWidth
            label="Ara"
            value=""
            placeholder="Varlık, olay, konum veya kaynak etiketi"
            InputProps={{ readOnly: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#e7f6f8',
                bgcolor: 'rgba(5, 15, 20, 0.82)',
                '& fieldset': { borderColor: 'rgba(126, 227, 255, 0.26)' },
                '&:hover fieldset': { borderColor: 'rgba(126, 227, 255, 0.44)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(126, 227, 255, 0.7)', borderWidth: 2 },
              },
              '& .MuiInputLabel-root': { color: 'rgba(220, 238, 243, 0.72)' },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(220, 238, 243, 0.45)', opacity: 1 },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.5,
            maxWidth: 760,
          }}
        >
          {suggestionRows.map((row, index) => (
            <Box
              key={row}
              sx={{
                p: 1.5,
                minHeight: 74,
                borderRadius: 1.5,
                bgcolor: 'rgba(15, 29, 36, 0.74)',
                border: '1px solid rgba(126, 227, 255, 0.12)',
                boxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.045), inset -4px -5px 8px rgba(0,0,0,0.34)',
              }}
            >
              <Typography sx={{ color: '#f0d247', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11 }}>
                ISR-{String(index + 1).padStart(2, '0')}
              </Typography>
              <Typography sx={{ mt: 0.6, fontWeight: 800 }}>{row}</Typography>
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
