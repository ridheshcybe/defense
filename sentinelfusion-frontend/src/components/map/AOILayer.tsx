import { useState } from 'react'
import { Polygon, Tooltip } from 'react-leaflet'
import type { AOI, AOITier } from '../../types'

export const TIER_COLORS: Record<AOITier, string> = {
  1: '#d32f2f',
  2: '#f57c00',
  3: '#1976d2',
  4: '#9e9e9e',
}

interface AOILayerProps {
  aois: AOI[]
  selectedAOI: AOI | null
  onSelectAOI: (aoi: AOI) => void
}

export function AOILayer({ aois, selectedAOI, onSelectAOI }: AOILayerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <>
      {aois.map((aoi) => {
        const isSelected = selectedAOI?.id === aoi.id
        const isHovered = hoveredId === aoi.id
        return (
          <Polygon
            key={aoi.id}
            positions={aoi.geometry.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{
              color: isHovered ? '#212121' : TIER_COLORS[aoi.tier],
              fillColor: TIER_COLORS[aoi.tier],
              fillOpacity: isSelected ? 0.4 : 0.15,
              weight: isSelected ? 3 : isHovered ? 2 : 1,
            }}
            eventHandlers={{
              click: () => onSelectAOI(aoi),
              mouseover: () => setHoveredId(aoi.id),
              mouseout: () => setHoveredId(null),
            }}
          >
            <Tooltip>{aoi.name}</Tooltip>
          </Polygon>
        )
      })}
    </>
  )
}
