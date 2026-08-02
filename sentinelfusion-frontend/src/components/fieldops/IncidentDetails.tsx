import { useState } from 'react'
import { Button, Chip, CircularProgress, Divider, Paper, Stack, Typography } from '@mui/material'
import { CheckCircle, Directions, NoteAdd, Person, PlayArrow } from '@mui/icons-material'
import type { FieldOpsUser, Incident, IncidentStatus } from '../../types'
import { SEVERITY_COLORS, STATUS_LABELS, TYPE_LABELS } from '../incidents/constants'
import { IncidentTimeline } from '../incidents/IncidentTimeline'
import { NoteDialog } from './NoteDialog'

interface IncidentDetailsProps {
  incident: Incident
  currentUser: FieldOpsUser
  users: FieldOpsUser[]
  onUpdateStatus: (status: IncidentStatus) => Promise<void> | void
  onAddNote: (note: string) => Promise<void> | void
}

export function IncidentDetails({
  incident,
  currentUser,
  users,
  onUpdateStatus,
  onAddNote,
}: IncidentDetailsProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [pending, setPending] = useState<IncidentStatus | null>(null)

  const update = async (status: IncidentStatus) => {
    setPending(status)
    try {
      await onUpdateStatus(status)
    } finally {
      setPending(null)
    }
  }

  const mapsUrl = `https://www.google.com/maps?q=${incident.location.lat},${incident.location.lng}`
  const assignee = incident.assignedTo
    ? users.find((user) => user.id === incident.assignedTo)?.name ?? incident.assignedTo
    : null

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">{TYPE_LABELS[incident.type]}</Typography>
            <Chip size="small" color={SEVERITY_COLORS[incident.severity]} label={incident.severity} />
          </Stack>
          <Chip
            size="small"
            variant="outlined"
            icon={<Person />}
            label={
              incident.assignedTo === currentUser.id
                ? 'Assigned to me'
                : assignee
                  ? `Assigned to ${assignee}`
                  : 'Unassigned'
            }
          />
        </Stack>

        <Typography variant="body2">{incident.description}</Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Chip size="small" variant="outlined" label={`Status: ${STATUS_LABELS[incident.status]}`} />
          <Typography variant="caption" color="text.secondary">
            {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            disabled={incident.status !== 'open' || pending !== null}
            onClick={() => update('in-progress')}
            sx={{ minHeight: 48 }}
          >
            {pending === 'in-progress' ? <CircularProgress size={18} color="inherit" /> : 'Start'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            disabled={incident.status === 'resolved' || pending !== null}
            onClick={() => update('resolved')}
            sx={{ minHeight: 48 }}
          >
            Complete
          </Button>
          <Button
            variant="outlined"
            startIcon={<NoteAdd />}
            onClick={() => setNoteOpen(true)}
            sx={{ minHeight: 48 }}
          >
            Add Note
          </Button>
          <Button
            component="a"
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            variant="outlined"
            startIcon={<Directions />}
            sx={{ minHeight: 48 }}
          >
            Navigate
          </Button>
        </Stack>

        <Divider />
        <IncidentTimeline incident={incident} />
      </Stack>

      <NoteDialog open={noteOpen} onCancel={() => setNoteOpen(false)} onSubmit={onAddNote} />
    </Paper>
  )
}
