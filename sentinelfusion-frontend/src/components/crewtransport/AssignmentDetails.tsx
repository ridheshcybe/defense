import { useState } from 'react'
import {
  Box, Button, Chip, CircularProgress, Divider, Paper, Stack, Typography,
} from '@mui/material'
import { CheckCircle, Directions, LocalShipping, NoteAdd, PlayArrow } from '@mui/icons-material'
import type { TransportAssignment, TransportStatus } from '../../types'
import { TRANSPORT_STATUS_COLORS, TRANSPORT_STATUS_LABELS } from './constants'
import { RouteCard } from './RouteCard'
import { NoteDialog } from '../fieldops/NoteDialog'

interface AssignmentDetailsProps {
  assignment: TransportAssignment
  onUpdateStatus: (status: TransportStatus) => Promise<void> | void
  onAddNote: (note: string) => Promise<void> | void
}

export function AssignmentDetails({
  assignment,
  onUpdateStatus,
  onAddNote,
}: AssignmentDetailsProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [pending, setPending] = useState<TransportStatus | null>(null)

  const update = async (status: TransportStatus) => {
    setPending(status)
    try {
      await onUpdateStatus(status)
    } finally {
      setPending(null)
    }
  }

  const firstStop = assignment.stops[0]
  const lastStop = assignment.stops[assignment.stops.length - 1]
  const mapsUrl =
    firstStop && lastStop
      ? `https://www.google.com/maps/dir/${firstStop.lat},${firstStop.lng}/${lastStop.lat},${lastStop.lng}`
      : 'https://www.google.com/maps'

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <LocalShipping color="primary" />
            <Typography variant="h6">{assignment.routeName}</Typography>
          </Stack>
          <Chip
            size="small"
            color={TRANSPORT_STATUS_COLORS[assignment.status]}
            label={TRANSPORT_STATUS_LABELS[assignment.status]}
          />
        </Stack>

        <RouteCard assignment={assignment} />

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Chip size="small" variant="outlined" label={`Vehicle: ${assignment.vehicle}`} />
          <Typography variant="caption" color="text.secondary">
            Updated {assignment.updatedAt}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            disabled={assignment.status !== 'planned' || pending !== null}
            onClick={() => update('in-progress')}
            sx={{ minHeight: 48 }}
          >
            {pending === 'in-progress' ? <CircularProgress size={18} color="inherit" /> : 'Start route'}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            disabled={assignment.status === 'completed' || pending !== null}
            onClick={() => update('completed')}
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
            Add note
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

        {assignment.notes.length > 0 && (
          <Box>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Route notes
            </Typography>
            <Stack spacing={0.5}>
              {assignment.notes.map((note) => (
                <Typography key={`${assignment.id}-${note}`} variant="body2" color="text.secondary">
                  • {note}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      <NoteDialog open={noteOpen} onCancel={() => setNoteOpen(false)} onSubmit={onAddNote} />
    </Paper>
  )
}
