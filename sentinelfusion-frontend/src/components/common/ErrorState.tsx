import { Alert, Box, Button, Stack } from '@mui/material'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="error" sx={{ mb: 1 }}>
        {message}
      </Alert>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" onClick={onRetry}>
          Retry
        </Button>
        <Button size="small" variant="text" onClick={() => console.log('Report issue', message)}>
          Report Issue
        </Button>
      </Stack>
    </Box>
  )
}
