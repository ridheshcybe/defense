import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import type { AOIDefinition, AOITier, OnboardingFormData } from '../../types'

interface AOIStepProps {
  form: OnboardingFormData
  onChange: (patch: Partial<OnboardingFormData>) => void
}

const TIERS: AOITier[] = [1, 2, 3, 4]

// Module-level counter so AOI ids never collide (Date.now() can repeat within a ms).
let aoiIdCounter = 0

// Map preview bounds (Mumbai metro). AOI dots are projected into this box.
const BOUNDS = { minLat: 18.9, maxLat: 19.3, minLng: 72.8, maxLng: 73.1 }

function project(lat: number, lng: number): { left: string; top: string } {
  const left = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100
  const top = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100
  return { left: `${left}%`, top: `${top}%` }
}

export function AOIStep({ form, onChange }: AOIStepProps) {
  const [name, setName] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [tier, setTier] = useState<AOITier>(1)

  const addAOI = () => {
    const latNum = Number.parseFloat(lat)
    const lngNum = Number.parseFloat(lng)
    if (!name.trim() || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) return
    const aoi: AOIDefinition = {
      id: `aoi-${++aoiIdCounter}`,
      name: name.trim(),
      lat: latNum,
      lng: lngNum,
      tier,
    }
    onChange({ aois: [...form.aois, aoi] })
    setName('')
    setLat('')
    setLng('')
  }

  const removeAOI = (id: string) => {
    onChange({ aois: form.aois.filter((aoi) => aoi.id !== id) })
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          position: 'relative',
          height: 220,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
        aria-label="Map preview"
      >
        <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
          Map preview — AOIs projected by lat/lng (drawing boxes coming soon)
        </Typography>
        {form.aois.map((aoi) => (
          <Box
            key={aoi.id}
            sx={{
              position: 'absolute',
              ...project(aoi.lat, aoi.lng),
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              transform: 'translate(-50%, -50%)',
              boxShadow: 1,
            }}
            title={`${aoi.name} (Tier ${aoi.tier})`}
          />
        ))}
      </Box>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
        <TextField
          label="AOI name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 160 }}
        />
        <TextField
          label="Lat"
          value={lat}
          onChange={(event) => setLat(event.target.value)}
          size="small"
          inputProps={{ inputMode: 'decimal' }}
        />
        <TextField
          label="Lng"
          value={lng}
          onChange={(event) => setLng(event.target.value)}
          size="small"
          inputProps={{ inputMode: 'decimal' }}
        />
        <TextField
          label="Tier"
          select
          value={tier}
          onChange={(event) => setTier(Number(event.target.value) as AOITier)}
          size="small"
          sx={{ width: 90 }}
        >
          {TIERS.map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={addAOI}>
          Add
        </Button>
      </Stack>

      <Stack spacing={0.5}>
        {form.aois.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No AOIs yet — add one above.
          </Typography>
        )}
        {form.aois.map((aoi) => (
          <Stack
            key={aoi.id}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ borderBottom: 1, borderColor: 'divider', pb: 0.5 }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {aoi.name}
            </Typography>
            <Chip size="small" label={`Tier ${aoi.tier}`} />
            <Typography variant="caption" color="text.secondary">
              {aoi.lat.toFixed(4)}, {aoi.lng.toFixed(4)}
            </Typography>
            <IconButton size="small" aria-label={`Remove ${aoi.name}`} onClick={() => removeAOI(aoi.id)}>
              <Delete fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}
