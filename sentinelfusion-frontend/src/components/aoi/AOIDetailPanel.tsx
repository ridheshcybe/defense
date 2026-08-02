import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { AutoAwesome } from '@mui/icons-material'
import type { AIPrediction, ZoneType } from '../../types'
import { useAnalyst } from '../../contexts/AnalystContext'
import { SEVERITY_COLORS, TYPE_LABELS } from '../incidents/constants'
import { runAOPrediction } from '../../api/aiApi'
import { toEpoch } from '../../utils/timestamp'

const ZONE_LABELS: Record<ZoneType, string> = {
  heatmap: 'Heatmap',
  'no-go': 'No-go',
  target: 'Target',
}

interface AIAnalysisState {
  aoiId: string
  prediction: AIPrediction | null
  error: string | null
}

export function AOIDetailPanel() {
  const { selectedAOI, incidents, zones } = useAnalyst()
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysisState | null>(null)

  if (!selectedAOI) return null

  // Only surface AI results that belong to the currently selected AOI, so
  // switching AOIs never shows a stale prediction/error.
  const currentAnalysis = analysis?.aoiId === selectedAOI.id ? analysis : null
  const prediction = currentAnalysis?.prediction ?? null
  const predictionError = currentAnalysis?.error ?? null

  const aoiZones = zones.filter((zone) => zone.aoiId === selectedAOI.id)
  const aoiIncidents = incidents
    .filter((incident) => incident.aoiId === selectedAOI.id)
    .sort((a, b) => toEpoch(b.timestamp) - toEpoch(a.timestamp))
  const criticalCount = aoiIncidents.filter((incident) => incident.severity === 'critical').length

  const runAnalysis = async () => {
    setAnalyzing(true)
    setAnalysis({ aoiId: selectedAOI.id, prediction: null, error: null })
    try {
      const result = await runAOPrediction(selectedAOI.id)
      setAnalysis({ aoiId: selectedAOI.id, prediction: result, error: null })
    } catch (err) {
      setAnalysis({
        aoiId: selectedAOI.id,
        prediction: null,
        error: err instanceof Error ? err.message : 'AI analysis failed',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        maxHeight: '40%',
        overflowY: 'auto',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {selectedAOI.name}
          </Typography>
          <Chip size="small" label={`Tier ${selectedAOI.tier}`} />
          <Chip size="small" label={selectedAOI.status} />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Fusion summary: {aoiIncidents.length} incidents in this AOI ({criticalCount} critical) ·
          last updated {selectedAOI.lastUpdated}.
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={analyzing ? <CircularProgress size={14} /> : <AutoAwesome />}
            onClick={() => void runAnalysis()}
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing…' : 'Run AI analysis'}
          </Button>
        </Stack>

        {predictionError && <Alert severity="error">{predictionError}</Alert>}

        {prediction && !predictionError && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              AI prediction: {TYPE_LABELS[prediction.incident_type]}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
              <Chip size="small" color={SEVERITY_COLORS[prediction.severity]} label={prediction.severity} />
              <Chip size="small" variant="outlined" label={`${Math.round(prediction.confidence * 100)}% confidence`} />
              {prediction.latency_ms !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  {prediction.latency_ms.toFixed(0)} ms
                </Typography>
              )}
            </Stack>
          </>
        )}

        {aoiZones.length > 0 && (
          <>
            <Typography variant="overline">Zones</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {aoiZones.map((zone) => (
                <Chip
                  key={zone.id}
                  size="small"
                  variant="outlined"
                  label={`${ZONE_LABELS[zone.type]} · ${zone.severityScore}`}
                />
              ))}
            </Stack>
          </>
        )}

        {aoiIncidents.length > 0 ? (
          <>
            <Typography variant="overline">Incident timeline</Typography>
            <List dense disablePadding>
              {aoiIncidents.map((incident) => (
                <ListItem key={incident.id} disableGutters>
                  <ListItemText
                    primary={TYPE_LABELS[incident.type]}
                    secondary={incident.timestamp}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Alert severity="info">No incidents in this AOI.</Alert>
        )}
      </Stack>
    </Box>
  )
}
