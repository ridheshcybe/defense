import { Alert, Box, CircularProgress, Paper, Snackbar, Stack, Typography } from '@mui/material'
import { Header } from '../components/layout/Header'
import { AssignmentList } from '../components/crewtransport/AssignmentList'
import { AssignmentDetails } from '../components/crewtransport/AssignmentDetails'
import { ErrorState } from '../components/common/ErrorState'
import { CrewTransportProvider, useCrewTransport } from '../contexts/CrewTransportContext'
import { useAuth } from '../contexts/AuthContext'

function CrewToasts() {
  const { toast, hideToast } = useCrewTransport()
  return (
    <Snackbar
      open={toast !== null}
      autoHideDuration={3000}
      onClose={hideToast}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={hideToast}>
        {toast?.message}
      </Alert>
    </Snackbar>
  )
}

function CrewTransportApp() {
  const { logout } = useAuth()
  const {
    assignments,
    selectedAssignment,
    currentUser,
    isLoading,
    error,
    selectAssignment,
    updateStatus,
    addNote,
    refetch,
  } = useCrewTransport()

  const selected = selectedAssignment
    ? (assignments.find((a) => a.id === selectedAssignment.id) ?? selectedAssignment)
    : null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header userRole="crew_transport" onLogout={logout} />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
            <CircularProgress aria-label="Loading assignments" />
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
              <AssignmentList
                assignments={assignments}
                currentUserId={currentUser.id}
                selectedAssignmentId={selected?.id ?? null}
                onSelect={(id) => {
                  const assignment = assignments.find((a) => a.id === id)
                  if (assignment) selectAssignment(assignment)
                }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
              {selected ? (
                <AssignmentDetails
                  assignment={selected}
                  onUpdateStatus={(status) => updateStatus(selected.id, status)}
                  onAddNote={(note) => addNote(selected.id, note)}
                />
              ) : (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                  <Stack spacing={1}>
                    <Typography variant="h6">No route selected</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tap a transport assignment to see the route and update its status.
                    </Typography>
                  </Stack>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Box>
      <CrewToasts />
    </Box>
  )
}

export function CrewTransportView() {
  return (
    <CrewTransportProvider>
      <CrewTransportApp />
    </CrewTransportProvider>
  )
}
