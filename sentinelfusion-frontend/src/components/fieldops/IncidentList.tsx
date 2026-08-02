import { useMemo, useState } from 'react'
import {
  Box, Card, CardActionArea, Chip, FormControl, InputLabel, MenuItem, Paper,
  Select, Stack, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import { Person } from '@mui/icons-material'
import type { Incident, IncidentSeverity, IncidentStatus } from '../../types'
import { SEVERITY_COLORS, STATUS_LABELS, TYPE_LABELS } from '../incidents/constants'
import { parseTimestamp, timeAgo } from '../../utils/time'

type StatusFilter = 'all' | IncidentStatus
type SortKey = 'newest' | 'oldest' | 'severity'

const SEVERITY_RANK: Record<IncidentSeverity, number> = { critical: 0, warning: 1, info: 2 }

interface IncidentListProps {
  incidents: Incident[]
  currentUserId: string
  selectedIncidentId: string | null
  onSelect: (id: string) => void
}

export function IncidentList({
  incidents,
  currentUserId,
  selectedIncidentId,
  onSelect,
}: IncidentListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [assignedOnly, setAssignedOnly] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const visible = useMemo(() => {
    const newestFirst = (a: Incident, b: Incident) =>
      parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp)
    const bySeverity = (a: Incident, b: Incident) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    const filtered = incidents.filter(
      (incident) =>
        (statusFilter === 'all' || incident.status === statusFilter) &&
        (!assignedOnly || incident.assignedTo === currentUserId),
    )
    const sorted = [...filtered].sort(
      sortKey === 'oldest'
        ? (a, b) => -newestFirst(a, b)
        : sortKey === 'severity'
          ? bySeverity
          : newestFirst,
    )
    return sorted
  }, [incidents, statusFilter, assignedOnly, sortKey, currentUserId])

  return (
    <Box>
      <Paper sx={{ p: 1, mb: 1 }}>
        <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="fieldops-status-label">Status</InputLabel>
            <Select
              labelId="fieldops-status-label"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup
            size="small"
            exclusive
            aria-label="Assigned filter"
            value={assignedOnly ? 'mine' : 'all'}
            onChange={(_, next) => {
              if (next) setAssignedOnly(next === 'mine')
            }}
          >
            <ToggleButton value="mine">Assigned to me</ToggleButton>
            <ToggleButton value="all">All</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="fieldops-sort-label">Sort</InputLabel>
            <Select
              labelId="fieldops-sort-label"
              label="Sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <MenuItem value="newest">Newest first</MenuItem>
              <MenuItem value="oldest">Oldest first</MenuItem>
              <MenuItem value="severity">Severity</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {visible.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
          No incidents match your filters.
        </Typography>
      )}

      <Stack spacing={1}>
        {visible.map((incident) => {
          const isSelected = incident.id === selectedIncidentId
          const mine = incident.assignedTo === currentUserId
          return (
            <Card
              key={incident.id}
              variant="outlined"
              data-testid={`incident-card-${incident.id}`}
              sx={{ bgcolor: isSelected ? 'action.selected' : 'background.paper' }}
            >
              <CardActionArea onClick={() => onSelect(incident.id)} sx={{ p: 1.5 }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {TYPE_LABELS[incident.type]}
                    </Typography>
                    <Chip
                      size="small"
                      color={SEVERITY_COLORS[incident.severity]}
                      label={incident.severity}
                    />
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Chip size="small" variant="outlined" label={STATUS_LABELS[incident.status]} />
                    {mine && (
                      <Chip size="small" color="primary" icon={<Person />} label="Assigned to me" />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)} ·{' '}
                    {timeAgo(incident.createdAt)}
                  </Typography>
                </Stack>
              </CardActionArea>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}
