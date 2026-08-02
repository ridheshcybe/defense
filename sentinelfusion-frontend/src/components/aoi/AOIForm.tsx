import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import type { AOI, CreateAOIDTO } from '../../types'

interface AOIFormProps {
  mode: 'create' | 'edit'
  initialData: AOI | null
  onSubmit: (data: CreateAOIDTO) => void
  onCancel: () => void
}

const NAME_MAX = 100

function isValidLat(value: string): boolean {
  const num = Number(value)
  return value.trim() !== '' && Number.isFinite(num) && num >= -90 && num <= 90
}

function isValidLng(value: string): boolean {
  const num = Number(value)
  return value.trim() !== '' && Number.isFinite(num) && num >= -180 && num <= 180
}

export function AOIForm({ mode, initialData, onSubmit, onCancel }: AOIFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [lat, setLat] = useState(initialData ? String(initialData.center.lat) : '')
  const [lng, setLng] = useState(initialData ? String(initialData.center.lng) : '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [tags, setTags] = useState(initialData?.tags.join(', ') ?? '')

  const nameError =
    name.trim() === ''
      ? 'Name is required.'
      : name.length > NAME_MAX
        ? `Name must be ${NAME_MAX} characters or fewer.`
        : null
  const latError = isValidLat(lat) ? null : 'Latitude must be between -90 and 90.'
  const lngError = isValidLng(lng) ? null : 'Longitude must be between -180 and 180.'
  const invalid = nameError !== null || latError !== null || lngError !== null

  const handleSubmit = () => {
    if (invalid) return
    onSubmit({
      name: name.trim(),
      center: { lat: Number(lat), lng: Number(lng) },
      description: description.trim() || undefined,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Create AOI' : 'Edit AOI'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Name"
          required
          fullWidth
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError !== null}
          helperText={nameError}
          slotProps={{ input: { 'aria-label': 'Name' } }}
        />
        <TextField
          label="Center Latitude"
          required
          fullWidth
          type="number"
          value={lat}
          onChange={(event) => setLat(event.target.value)}
          error={latError !== null}
          helperText={latError}
          slotProps={{ input: { 'aria-label': 'Center Latitude' } }}
        />
        <TextField
          label="Center Longitude"
          required
          fullWidth
          type="number"
          value={lng}
          onChange={(event) => setLng(event.target.value)}
          error={lngError !== null}
          helperText={lngError}
          slotProps={{ input: { 'aria-label': 'Center Longitude' } }}
        />
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          slotProps={{ input: { 'aria-label': 'Description' } }}
        />
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
