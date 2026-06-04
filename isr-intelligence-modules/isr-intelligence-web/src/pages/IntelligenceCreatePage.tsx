import { Box, Stack, TextField, Typography } from '@mui/material';

const fields = ['Başlık', 'Öncelik', 'Kaynak', 'Açıklama'];

export default function IntelligenceCreatePage() {
  return (
    <Box
      data-testid="intelligence-create-page"
      sx={{
        minHeight: 'calc(100vh - 132px)',
        p: { xs: 2, md: 4 },
        bgcolor: '#0b151b',
        color: '#dceef3',
      }}
    >
      <Stack spacing={2.5} sx={{ maxWidth: 920 }}>
        <Box>
          <Typography sx={{ color: '#f0d247', fontSize: 12, fontWeight: 800, letterSpacing: 0 }}>
            İSTİHBARAT VERİ YÖNETİMİ
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.4, fontWeight: 900, letterSpacing: 0 }}>
            İstihbarat Yarat
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: 'rgba(18, 31, 38, 0.88)',
            border: '1px solid rgba(126, 227, 255, 0.18)',
            boxShadow:
              '14px 18px 32px rgba(0, 0, 0, 0.44), inset 2px 2px 5px rgba(255,255,255,0.055), inset -5px -6px 12px rgba(0,0,0,0.42)',
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {fields.map((field) => (
              <TextField
                key={field}
                label={field}
                value=""
                InputProps={{ readOnly: true }}
                multiline={field === 'Açıklama'}
                minRows={field === 'Açıklama' ? 4 : undefined}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#e7f6f8',
                    bgcolor: 'rgba(5, 15, 20, 0.82)',
                    '& fieldset': { borderColor: 'rgba(126, 227, 255, 0.24)' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(126, 227, 255, 0.66)', borderWidth: 2 },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(220, 238, 243, 0.72)' },
                }}
              />
            ))}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
