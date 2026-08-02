import { Alert, Box, CircularProgress, Paper, Snackbar, Stack, Typography } from '@mui/material'
import { Header } from '../components/layout/Header'
import { IncidentList } from '../components/fieldops/IncidentList'
import { IncidentDetails } from '../components/fieldops/IncidentDetails'
import { FieldOpsBottomNav } from '../components/layout/FieldOpsBottomNav'
import { ErrorState } from '../components/common/ErrorState'
import { FieldOpsProvider, useFieldOps } from '../contexts/FieldOpsContext'
import { useAuth } from '../contexts/AuthContext'

function FieldOpsToasts() {
  const { toast, hideToast } = useFieldOps()
  return (
    <Snackbar
      open={toast !== null}
      autoHideDuration={3000}
      onClose={hideToast}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: 7 }} // clear the bottom navigation
    >
      <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={hideToast}>
        {toast?.message}
      </Alert>
    </Snackbar>
  )
}

function FieldOpsApp() {
  const {
    incidents,
    selectedIncident,
    currentUser,
    users,
    isLoading,
    error,
    selectIncident,
    updateIncidentStatus,
    addNote,
    refetch,
  } = useFieldOps()
  const { logout } = useAuth()

  // Derive the live incident so details reflect status/note updates immediately.
  const selected = selectedIncident
    ? (incidents.find((incident) => incident.id === selectedIncident.id) ?? selectedIncident)
    : null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header userRole="field_ops" onLogout={logout} />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
            <CircularProgress aria-label="Loading incidents" />
          </Box>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1,
              alignItems: 'flex-start',
            }}
          >
            <Box sx={{ width: { xs: '100%', md: '38%' } }}>
              <IncidentList
                incidents={incidents}
                currentUserId={currentUser.id}
                selectedIncidentId={selected?.id ?? null}
                onSelect={(id) => {
                  const incident = incidents.find((i) => i.id === id)
                  if (incident) selectIncident(incident)
                }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
              {selected ? (
                <IncidentDetails
                  incident={selected}
                  currentUser={currentUser}
                  users={users}
                  onUpdateStatus={(status) => updateIncidentStatus(selected.id, status)}
                  onAddNote={(note) => addNote(selected.id, note)}
                />
              ) : (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                  <Stack spacing={1}>
                    <Typography variant="h6">No incident selected</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tap an incident card to see details and update its status.
                    </Typography>
                  </Stack>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Box>
      <FieldOpsBottomNav userName={currentUser.name} />
      <FieldOpsToasts />
    </Box>
  )
}

export function FieldOpsView() {
  return (
    <FieldOpsProvider>
      <FieldOpsApp />
    </FieldOpsProvider>
  )
}
