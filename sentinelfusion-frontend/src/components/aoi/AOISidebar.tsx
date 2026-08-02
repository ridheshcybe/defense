import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Tooltip,
} from '@mui/material'
import { Add, Delete, Edit } from '@mui/icons-material'
import type { AOI, AOIStatus, CreateAOIDTO } from '../../types'
import { useAnalyst } from '../../contexts/AnalystContext'
import { ErrorState } from '../common/ErrorState'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { AOIForm } from './AOIForm'

const STATUS_COLORS: Record<AOIStatus, 'success' | 'info' | 'warning' | 'default'> = {
  active: 'success',
  monitoring: 'info',
  standby: 'warning',
  archived: 'default',
}

const DEBOUNCE_MS = 300

export function AOISidebar() {
  const {
    selectedAOI,
    isLoading,
    error,
    refetch,
    filterAOIs,
    selectAOI,
    createAOI,
    updateAOI,
    deleteAOI,
  } = useAnalyst()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingAOI, setEditingAOI] = useState<AOI | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AOI | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const filtered = filterAOIs(debouncedQuery)

  const handleSubmit = async (data: CreateAOIDTO) => {
    if (formMode === 'edit' && editingAOI) {
      await updateAOI(editingAOI.id, data)
    } else {
      await createAOI(data)
    }
    setFormMode(null)
    setEditingAOI(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteAOI(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress aria-label="Loading AOIs" />
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
          onClick={() => {
            setFormMode('create')
            setEditingAOI(null)
          }}
        >
          Create AOI
        </Button>
      </Box>
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search AOIs…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Box>
      {filtered.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="info">No AOIs found</Alert>
        </Box>
      ) : (
        <List dense sx={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((aoi) => (
            <ListItemButton
              key={aoi.id}
              selected={aoi.id === selectedAOI?.id}
              onClick={() => selectAOI(aoi)}
              sx={{
                '& .aoi-actions': { opacity: 0, transition: 'opacity 150ms ease' },
                '&:hover .aoi-actions': { opacity: 1 },
                '&:focus-within .aoi-actions': { opacity: 1 },
              }}
            >
              <Badge
                badgeContent={aoi.incidentCount}
                color="error"
                sx={{ mr: 1.5 }}
                invisible={aoi.incidentCount === 0}
              >
                <Box
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${STATUS_COLORS[aoi.status]}.main` }}
                />
              </Badge>
              <ListItemText
                primary={aoi.name}
                secondary={`Updated ${aoi.lastUpdated}`}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
              />
              <Chip size="small" color={STATUS_COLORS[aoi.status]} label={aoi.status} variant="outlined" />
              <Box className="aoi-actions" sx={{ display: 'flex' }}>
                <Tooltip title="Edit AOI">
                  <IconButton
                    size="small"
                    aria-label="Edit AOI"
                    onClick={(event) => {
                      event.stopPropagation()
                      setEditingAOI(aoi)
                      setFormMode('edit')
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete AOI">
                  <IconButton
                    size="small"
                    aria-label="Delete AOI"
                    onClick={(event) => {
                      event.stopPropagation()
                      setDeleteTarget(aoi)
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItemButton>
          ))}
        </List>
      )}

      {formMode !== null && (
        <AOIForm
          mode={formMode}
          initialData={formMode === 'edit' ? editingAOI : null}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormMode(null)
            setEditingAOI(null)
          }}
        />
      )}
      {deleteTarget !== null && (
        <ConfirmDialog
          title="Delete AOI"
          message={`Are you sure you want to delete AOI '${deleteTarget.name}'? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Box>
  )
}
