import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import type {
  CreateIncidentDTO,
  Incident,
  IncidentSeverity,
  IncidentType,
} from '../../types'
import { useAnalyst } from '../../contexts/AnalystContext'
import { SEVERITY_COLORS, TYPE_LABELS } from './constants'

interface IncidentFormProps {
  mode: 'create' | 'edit'
  initialData: Incident | null
  onSubmit: (data: CreateIncidentDTO) => void
  onCancel: () => void
}

function isValidLat(value: string): boolean {
  const num = Number(value)
  return value.trim() !== '' && Number.isFinite(num) && num >= -90 && num <= 90
}

function isValidLng(value: string): boolean {
  const num = Number(value)
  return value.trim() !== '' && Number.isFinite(num) && num >= -180 && num <= 180
}

const INCIDENT_TYPES = Object.keys(TYPE_LABELS) as IncidentType[]
const SEVERITIES = Object.keys(SEVERITY_COLORS) as IncidentSeverity[]

export function IncidentForm({ mode, initialData, onSubmit, onCancel }: IncidentFormProps) {
  const { aois } = useAnalyst()
  const [type, setType] = useState<IncidentType | ''>(initialData?.type ?? '')
  const [severity, setSeverity] = useState<IncidentSeverity | ''>(initialData?.severity ?? '')
  const [lat, setLat] = useState(initialData ? String(initialData.location.lat) : '')
  const [lng, setLng] = useState(initialData ? String(initialData.location.lng) : '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [aoiId, setAoiId] = useState(initialData?.aoiId ?? '')
  const [tags, setTags] = useState(initialData?.groupTags.join(', ') ?? '')

  const typeError = type === '' ? 'Type is required.' : null
  const severityError = severity === '' ? 'Severity is required.' : null
  const latError = isValidLat(lat) ? null : 'Latitude must be between -90 and 90.'
  const lngError = isValidLng(lng) ? null : 'Longitude must be between -180 and 180.'
  const descriptionError = description.trim() === '' ? 'Description is required.' : null
  const aoiError = aoiId === '' ? 'Associated AOI is required.' : null
  const invalid =
    typeError !== null ||
    severityError !== null ||
    latError !== null ||
    lngError !== null ||
    descriptionError !== null ||
    aoiError !== null

  const handleSubmit = () => {
    if (invalid) return
    onSubmit({
      type: type as IncidentType,
      severity: severity as IncidentSeverity,
      location: { lat: Number(lat), lng: Number(lng) },
      description: description.trim(),
      aoiId,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Create Incident' : 'Edit Incident'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth error={typeError !== null}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            Type *
          </Typography>
          <Select
            size="small"
            aria-label="Type"
            value={type}
            onChange={(event) => setType(event.target.value as IncidentType | '')}
          >
            <MenuItem value="" disabled>
              Select a type…
            </MenuItem>
            {INCIDENT_TYPES.map((incidentType) => (
              <MenuItem key={incidentType} value={incidentType}>
                {TYPE_LABELS[incidentType]}
              </MenuItem>
            ))}
          </Select>
          {typeError !== null && <FormHelperText>{typeError}</FormHelperText>}
        </FormControl>
        <FormControl fullWidth error={severityError !== null}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            Severity *
          </Typography>
          <Select
            size="small"
            aria-label="Severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as IncidentSeverity | '')}
          >
            <MenuItem value="" disabled>
              Select a severity…
            </MenuItem>
            {SEVERITIES.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </Select>
          {severityError !== null && <FormHelperText>{severityError}</FormHelperText>}
        </FormControl>
        <TextField
          label="Location Latitude"
          required
          fullWidth
          type="number"
          value={lat}
          onChange={(event) => setLat(event.target.value)}
          error={latError !== null}
          helperText={latError}
          slotProps={{ input: { 'aria-label': 'Location Latitude' } }}
        />
        <TextField
          label="Location Longitude"
          required
          fullWidth
          type="number"
          value={lng}
          onChange={(event) => setLng(event.target.value)}
          error={lngError !== null}
          helperText={lngError}
          slotProps={{ input: { 'aria-label': 'Location Longitude' } }}
        />
        <TextField
          label="Description"
          required
          fullWidth
          multiline
          rows={6}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={descriptionError !== null}
          helperText={descriptionError}
          slotProps={{ input: { 'aria-label': 'Description' } }}
        />
        <FormControl fullWidth error={aoiError !== null}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            Associated AOI *
          </Typography>
          <Select
            size="small"
            aria-label="Associated AOI"
            value={aoiId}
            onChange={(event) => setAoiId(event.target.value)}
          >
            <MenuItem value="" disabled>
              Select an AOI…
            </MenuItem>
            {aois.map((aoi) => (
              <MenuItem key={aoi.id} value={aoi.id}>
                {aoi.name}
              </MenuItem>
            ))}
          </Select>
          {aoiError !== null && <FormHelperText>{aoiError}</FormHelperText>}
        </FormControl>
        <TextField
          label="Tags"
          fullWidth
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          helperText="Comma-separated tags (optional)"
          slotProps={{ input: { 'aria-label': 'Tags' } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" disabled={invalid} onClick={handleSubmit}>
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
