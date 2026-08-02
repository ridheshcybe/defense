import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import { Box, Chip, Stack, Typography } from '@mui/material'
import type { Incident, IncidentSeverity } from '../../types'
import { SEVERITY_COLORS, TYPE_LABELS } from '../incidents/constants'

const SEVERITY_HTML: Record<IncidentSeverity, string> = {
  critical: '#d32f2f',
  warning: '#f57c00',
  info: '#388e3c',
}

function severityIcon(severity: IncidentSeverity): L.DivIcon {
  return L.divIcon({
    className: 'incident-marker',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${SEVERITY_HTML[severity]};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

// Build the three severity icons once instead of per-render/per-marker.
const SEVERITY_ICONS: Record<IncidentSeverity, L.DivIcon> = {
  critical: severityIcon('critical'),
  warning: severityIcon('warning'),
  info: severityIcon('info'),
}

interface IncidentLayerProps {
  incidents: Incident[]
  onSelectIncident: (incident: Incident) => void
}

export function IncidentLayer({ incidents, onSelectIncident }: IncidentLayerProps) {
  return (
    <>
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.location.lat, incident.location.lng]}
          icon={SEVERITY_ICONS[incident.severity]}
          eventHandlers={{ click: () => onSelectIncident(incident) }}
        >
          <Popup>
            <Box sx={{ minWidth: 180 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">{TYPE_LABELS[incident.type]}</Typography>
                <Chip
                  size="small"
                  label={incident.severity}
                  color={SEVERITY_COLORS[incident.severity]}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {incident.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {incident.timestamp}
              </Typography>
            </Box>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
