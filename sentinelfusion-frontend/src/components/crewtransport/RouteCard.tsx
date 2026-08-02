import { Chip, Paper, Stack, Typography } from '@mui/material'
import { Schedule } from '@mui/icons-material'
import type { TransportAssignment } from '../../types'
import { TRANSPORT_STATUS_COLORS, TRANSPORT_STATUS_LABELS } from './constants'

interface RouteCardProps {
  assignment: TransportAssignment
}

function RouteSvg({ stops }: { stops: TransportAssignment['stops'] }) {
  // Normalize stops onto a 100x40 viewBox for a simple polyline route sketch.
  if (stops.length === 0) return null
  const lats = stops.map((stop) => stop.lat)
  const lngs = stops.map((stop) => stop.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const pad = 4
  const toX = (lng: number) =>
    pad + ((lng - minLng) / Math.max(maxLng - minLng, 1e-6)) * (100 - pad * 2)
  const toY = (lat: number) =>
    40 - pad - ((lat - minLat) / Math.max(maxLat - minLat, 1e-6)) * (40 - pad * 2)
  const points = stops.map((stop) => `${toX(stop.lng).toFixed(1)},${toY(stop.lat).toFixed(1)}`)

  return (
    <svg
      viewBox="0 0 100 40"
      role="img"
      aria-label="Route path"
      data-testid="route-svg"
      style={{ width: '100%', height: 64, display: 'block' }}
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      {points.map((point, index) => (
        <circle
          key={point}
          cx={Number(point.split(',')[0])}
          cy={Number(point.split(',')[1])}
          r={index === 0 || index === points.length - 1 ? 3.5 : 2}
          fill="currentColor"
        />
      ))}
    </svg>
  )
}

export function RouteCard({ assignment }: RouteCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {assignment.origin} → {assignment.destination}
          </Typography>
          <Chip
            size="small"
            color={TRANSPORT_STATUS_COLORS[assignment.status]}
            label={TRANSPORT_STATUS_LABELS[assignment.status]}
          />
        </Stack>
        <RouteSvg stops={assignment.stops} />
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Chip size="small" variant="outlined" icon={<Schedule />} label={`ETA ${assignment.etaMinutes} min`} />
          <Typography variant="caption" color="text.secondary">
            {assignment.vehicle} · {assignment.stops.length} stops
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}
