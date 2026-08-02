import { useEffect, useState } from 'react'
import { Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { FitScreen, Fullscreen, RestartAlt } from '@mui/icons-material'
import { MapContainer as LeafletMap, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { AOI, AOITier, Incident, MapCenter, ZoneType } from '../../types'
import { useAnalyst } from '../../contexts/AnalystContext'
import { AOILayer, TIER_COLORS } from './AOILayer'
import { IncidentLayer } from './IncidentLayer'
import { ErrorState } from '../common/ErrorState'
import 'leaflet/dist/leaflet.css'

export const DEFAULT_VIEW: MapCenter = { lat: 20.5937, lng: 78.9629, zoom: 6 }

const FLY_ZOOM_AOI = 12
const FLY_ZOOM_INCIDENT = 14

const ZONE_COLORS: Record<ZoneType, string> = {
  heatmap: '#ff9800',
  'no-go': '#d32f2f',
  target: '#9c27b0',
}

interface MapControllerProps {
  aois: AOI[]
  selectedAOI: AOI | null
  selectedIncident: Incident | null
  showAOIs: boolean
  showIncidents: boolean
  onToggleAOIs: () => void
  onToggleIncidents: () => void
}

// Overlay controls live inside the map (not sibling overlays) because they need useMap().
// react-leaflet v5 portals non-leaflet children into the map container, so absolute
// positioning + zIndex 1000 keeps them above the tile panes. Owns flyTo sync too.
function MapController({
  aois,
  selectedAOI,
  selectedIncident,
  showAOIs,
  showIncidents,
  onToggleAOIs,
  onToggleIncidents,
}: MapControllerProps) {
  const map = useMap()

  // Map ↔ selection sync: a clicked incident wins over the selected AOI.
  useEffect(() => {
    if (selectedIncident) {
      map.flyTo(
        [selectedIncident.location.lat, selectedIncident.location.lng],
        FLY_ZOOM_INCIDENT,
        { duration: 0.8 },
      )
    } else if (selectedAOI) {
      map.flyTo([selectedAOI.center.lat, selectedAOI.center.lng], FLY_ZOOM_AOI, { duration: 0.8 })
    }
  }, [map, selectedAOI, selectedIncident])

  const fitToData = () => {
    const targets = selectedAOI ? [selectedAOI] : aois
    if (targets.length === 0) return
    const bounds = targets.flatMap((aoi) =>
      aoi.geometry.map((point) => [point.lat, point.lng] as [number, number]),
    )
    map.fitBounds(bounds, { padding: [24, 24] })
  }

  const resetView = () => {
    map.flyTo([DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], DEFAULT_VIEW.zoom ?? 6, { duration: 0.8 })
  }

  const toggleFullscreen = () => {
    const el = map.getContainer()
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    } else {
      el.requestFullscreen?.()
    }
  }

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <Button size="small" variant="contained" startIcon={<RestartAlt />} onClick={resetView}>
          Reset view
        </Button>
        <Button size="small" variant="contained" startIcon={<FitScreen />} onClick={fitToData}>
          Fit to AOI
        </Button>
        <Button size="small" variant="contained" startIcon={<Fullscreen />} onClick={toggleFullscreen}>
          Fullscreen
        </Button>
      </Box>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'absolute',
          top: 132,
          right: 8,
          zIndex: 1000,
          bgcolor: 'background.paper',
          p: 0.5,
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Chip
          size="small"
          label="AOIs"
          color={showAOIs ? 'primary' : 'default'}
          onClick={onToggleAOIs}
        />
        <Chip
          size="small"
          label="Incidents"
          color={showIncidents ? 'primary' : 'default'}
          onClick={onToggleIncidents}
        />
      </Stack>
    </>
  )
}

export function MapContainer() {
  const {
    aois,
    incidents,
    zones,
    selectedAOI,
    selectedIncident,
    selectAOI,
    selectIncident,
    isLoading,
    error,
    refetch,
  } = useAnalyst()
  const [showAOIs, setShowAOIs] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)

  if (isLoading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress aria-label="Loading map" />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ErrorState message={error} onRetry={refetch} />
      </Box>
    )
  }

  const center: [number, number] = [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng]
  const visibleIncidents = selectedAOI
    ? incidents.filter((incident) => incident.aoiId === selectedAOI.id)
    : incidents
  const visibleZones = selectedAOI ? zones.filter((zone) => zone.aoiId === selectedAOI.id) : zones

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <LeafletMap center={center} zoom={DEFAULT_VIEW.zoom ?? 6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showAOIs && <AOILayer aois={aois} selectedAOI={selectedAOI} onSelectAOI={selectAOI} />}
        {visibleZones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.geometry.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{
              color: ZONE_COLORS[zone.type],
              fillColor: ZONE_COLORS[zone.type],
              fillOpacity: 0.25,
              dashArray: '6 4',
            }}
          >
            <Tooltip>
              {zone.type} · score {zone.severityScore}
            </Tooltip>
          </Polygon>
        ))}
        {showIncidents && (
          <IncidentLayer incidents={visibleIncidents} onSelectIncident={selectIncident} />
        )}
        <MapController
          aois={aois}
          selectedAOI={selectedAOI}
          selectedIncident={selectedIncident}
          showAOIs={showAOIs}
          showIncidents={showIncidents}
          onToggleAOIs={() => setShowAOIs((value) => !value)}
          onToggleIncidents={() => setShowIncidents((value) => !value)}
        />
      </LeafletMap>

      <Box sx={{ position: 'absolute', top: 8, left: 48 }}>
        <Chip
          size="small"
          variant="outlined"
          color={selectedAOI ? 'primary' : 'default'}
          label={selectedAOI ? `Selected: ${selectedAOI.name}` : 'No AOI selected'}
        />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          bgcolor: 'background.paper',
          p: 1,
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Tiers
          </Typography>
          {([1, 2, 3, 4] as AOITier[]).map((tier) => (
            <Box key={tier} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: TIER_COLORS[tier] }} />
              <Typography variant="caption">Tier {tier}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
