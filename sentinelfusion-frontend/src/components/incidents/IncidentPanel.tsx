import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { Add, ContentCopy, Delete, Edit, IosShare } from '@mui/icons-material'
import type { CreateIncidentDTO, Incident, IncidentSeverity, IncidentStatus, TriageLabel } from '../../types'
import { useAnalyst } from '../../contexts/AnalystContext'
import { ErrorState } from '../common/ErrorState'
import { ConfirmDialog } from '../common/ConfirmDialog'
import {
  MODALITY_LABELS,
  SEVERITY_COLORS,
  SEVERITY_OPTIONS,
  STATUS_LABELS,
  TRIAGE_LABELS,
  TYPE_ICONS,
  TYPE_LABELS,
} from './constants'
import { toEpoch } from '../../utils/timestamp'
import { IncidentForm } from './IncidentForm'
import { IncidentTimeline } from './IncidentTimeline'

interface IncidentDetailCardProps {
  incident: Incident
  onEdit: () => void
  onDelete: (incident: Incident) => void
}

function IncidentDetailCard({ incident, onEdit, onDelete }: IncidentDetailCardProps) {
  const { aois, entities, groups, users, setTriage, updateIncidentStatus, assignIncident, selectAOI } =
    useAnalyst()
  const TypeIcon = TYPE_ICONS[incident.type]
  const linkedEntities = entities.filter((entity) => incident.entityIds.includes(entity.id))
  const linkedGroups = groups.filter((group) => incident.groupTags.includes(group.tag))
  const aoi = aois.find((a) => a.id === incident.aoiId)

  const handleCopy = () => {
    const text = `${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}`
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => console.log('Copy location', text))
    } else {
      console.log('Copy location', text)
    }
  }

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', overflowY: 'auto' }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TypeIcon fontSize="small" color="action" />
          <Typography variant="subtitle2">{TYPE_LABELS[incident.type]}</Typography>
          <Chip size="small" color={SEVERITY_COLORS[incident.severity]} label={incident.severity} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {incident.description}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="caption" color="text.secondary">
            Location: {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
          </Typography>
          <Button size="small" variant="outlined" startIcon={<ContentCopy />} onClick={handleCopy}>
            Copy
          </Button>
          {aoi && (
            <Button size="small" onClick={() => selectAOI(aoi)}>
              {aoi.name}
            </Button>
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Modalities: {incident.modalitiesUsed.map((modality) => MODALITY_LABELS[modality]).join(', ')}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Select
            size="small"
            value={incident.triageLabel}
            aria-label="Triage label"
            onChange={(event) => setTriage(incident.id, event.target.value as TriageLabel)}
          >
            {(Object.keys(TRIAGE_LABELS) as TriageLabel[]).map((label) => (
              <MenuItem key={label} value={label}>
                {TRIAGE_LABELS[label]}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={incident.status}
            aria-label="Incident status"
            onChange={(event) => updateIncidentStatus(incident.id, event.target.value as IncidentStatus)}
          >
            {(Object.keys(STATUS_LABELS) as IncidentStatus[]).map((status) => (
              <MenuItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={incident.assignedTo ?? ''}
            aria-label="Assigned to"
            onChange={(event) => assignIncident(incident.id, event.target.value === '' ? null : event.target.value)}
          >
            <MenuItem value="">Unassigned</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        {linkedEntities.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Entities: {linkedEntities.map((entity) => entity.name).join(', ')}
          </Typography>
        )}
        {linkedGroups.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {linkedGroups.map((group) => (
              <Chip key={group.id} size="small" variant="outlined" label={group.tag} />
            ))}
          </Stack>
        )}
        <Typography variant="caption" color="text.secondary">
          Created {incident.createdAt} · Updated {incident.updatedAt}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="outlined" startIcon={<Edit />} onClick={onEdit}>
            Edit
          </Button>
          <Button size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={() => onDelete(incident)}>
            Delete
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<IosShare />}
            onClick={() => console.log('Export Report', incident.id)}
          >
            Export Report
          </Button>
        </Stack>
        <IncidentTimeline incident={incident} />
      </Stack>
    </Box>
  )
}

export function IncidentPanel() {
  const {
    selectedAOI,
    selectedIncident,
    isLoading,
    error,
    refetch,
    incidents,
    filterIncidents,
    selectIncident,
    createIncident,
    updateIncident,
    deleteIncident,
  } = useAnalyst()
  const [severity, setSeverity] = useState<'all' | IncidentSeverity>('all')
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null)

  const scoped = useMemo(
    () => (selectedAOI ? filterIncidents(selectedAOI.id) : incidents),
    [selectedAOI, filterIncidents, incidents],
  )

  const visible = useMemo(() => {
    const bySeverity =
      severity === 'all' ? scoped : scoped.filter((incident) => incident.severity === severity)
    return [...bySeverity].sort((a, b) => toEpoch(b.timestamp) - toEpoch(a.timestamp))
  }, [scoped, severity])

  const selected = incidents.find((incident) => incident.id === selectedIncident?.id) ?? null

  const handleSubmit = async (data: CreateIncidentDTO) => {
    if (formMode === 'edit' && selected) {
      await updateIncident(selected.id, data)
    } else {
      await createIncident(data)
    }
    setFormMode(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteIncident(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress aria-label="Loading incidents" />
      </Box>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => setFormMode('create')}
        >
          Create Incident
        </Button>
      </Box>
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Select
          size="small"
          fullWidth
          value={severity}
          onChange={(event) => setSeverity(event.target.value as 'all' | IncidentSeverity)}
          aria-label="Severity filter"
        >
          {SEVERITY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
      {visible.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="info">No incidents found</Alert>
        </Box>
      ) : (
        <List dense sx={{ flex: 1, overflowY: 'auto' }}>
          {visible.map((incident) => {
            const TypeIcon = TYPE_ICONS[incident.type]
            return (
              <ListItemButton
                key={incident.id}
                selected={incident.id === selected?.id}
                onClick={() => selectIncident(incident)}
              >
                <TypeIcon
                  fontSize="small"
                  sx={{ mr: 1.5 }}
                  color={incident.severity === 'critical' ? 'error' : 'action'}
                />
                <ListItemText
                  primary={TYPE_LABELS[incident.type]}
                  secondary={incident.timestamp}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
                <Chip
                  size="small"
                  color={SEVERITY_COLORS[incident.severity]}
                  label={incident.severity}
                  variant="outlined"
                />
              </ListItemButton>
            )
          })}
        </List>
      )}
      {selected && (
        <IncidentDetailCard
          key={selected.id}
          incident={selected}
          onEdit={() => setFormMode('edit')}
          onDelete={(incident) => setDeleteTarget(incident)}
        />
      )}
      {formMode !== null && (
        <IncidentForm
          mode={formMode}
          initialData={formMode === 'edit' ? selected : null}
          onSubmit={handleSubmit}
          onCancel={() => setFormMode(null)}
        />
      )}
      {deleteTarget !== null && (
        <ConfirmDialog
          title="Delete Incident"
          message={`Are you sure you want to delete this ${TYPE_LABELS[deleteTarget.type]} incident? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Box>
  )
}