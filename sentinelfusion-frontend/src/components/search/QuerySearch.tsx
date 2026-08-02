import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { TYPE_LABELS } from '../incidents/constants'
import { useAnalyst } from '../../contexts/AnalystContext'

const DEBOUNCE_MS = 300

export function QuerySearch() {
  const { query, setQuery, runQuery, selectIncident } = useAnalyst()
  const [debounced, setDebounced] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const results = runQuery(debounced)

  return (
    <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <TextField
        size="small"
        fullWidth
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder='Try: "terrorist" or "mumbai protest"'
        slotProps={{
          input: {
            'aria-label': 'Natural language query',
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      {debounced.trim() && (
        <Box sx={{ mt: 1, maxHeight: 160, overflowY: 'auto' }}>
          {results.length === 0 ? (
            <Alert severity="info">No incidents match your query</Alert>
          ) : (
            <List dense disablePadding>
              {results.slice(0, 6).map((incident) => (
                <ListItemButton key={incident.id} onClick={() => selectIncident(incident)}>
                  <ListItemText
                    primary={TYPE_LABELS[incident.type]}
                    secondary={incident.timestamp}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  />
                  <Chip size="small" label={incident.severity} />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  )
}
