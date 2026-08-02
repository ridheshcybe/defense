import { useMemo, useState } from 'react'
import {
  Box, Card, CardActionArea, Chip, FormControl, InputLabel, MenuItem, Paper,
  Select, Stack, Typography,
} from '@mui/material'
import { Person, Schedule } from '@mui/icons-material'
import type { TransportAssignment, TransportStatus } from '../../types'
import { TRANSPORT_STATUS_COLORS, TRANSPORT_STATUS_LABELS } from './constants'

type StatusFilter = 'all' | TransportStatus

interface AssignmentListProps {
  assignments: TransportAssignment[]
  currentUserId: string
  selectedAssignmentId: string | null
  onSelect: (id: string) => void
}

export function AssignmentList({
  assignments,
  currentUserId,
  selectedAssignmentId,
  onSelect,
}: AssignmentListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const visible = useMemo(
    () => assignments.filter((a) => statusFilter === 'all' || a.status === statusFilter),
    [assignments, statusFilter],
  )

  return (
    <Box>
      <Paper sx={{ p: 1, mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="crew-status-label">Status</InputLabel>
          <Select
            labelId="crew-status-label"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="planned">Planned</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {visible.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
          No assignments match your filters.
        </Typography>
      )}

      <Stack spacing={1}>
        {visible.map((assignment) => {
          const isSelected = assignment.id === selectedAssignmentId
          const mine = assignment.assignedTo === currentUserId
          return (
            <Card
              key={assignment.id}
              variant="outlined"
              data-testid={`assignment-card-${assignment.id}`}
              sx={{ bgcolor: isSelected ? 'action.selected' : 'background.paper' }}
            >
              <CardActionArea onClick={() => onSelect(assignment.id)} sx={{ p: 1.5 }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {assignment.routeName}
                    </Typography>
                    <Chip
                      size="small"
                      color={TRANSPORT_STATUS_COLORS[assignment.status]}
                      label={TRANSPORT_STATUS_LABELS[assignment.status]}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {assignment.origin} → {assignment.destination}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                    <Chip size="small" variant="outlined" icon={<Schedule />} label={`ETA ${assignment.etaMinutes} min`} />
                    {mine && <Chip size="small" color="primary" icon={<Person />} label="Assigned to me" />}
                  </Stack>
                </Stack>
              </CardActionArea>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}
