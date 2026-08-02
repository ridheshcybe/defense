import { useState } from 'react'
import { Alert, Box, Snackbar } from '@mui/material'
import { Header } from '../components/layout/Header'
import { ThreeColumnLayout } from '../components/layout/ThreeColumnLayout'
import { MapContainer } from '../components/map/MapContainer'
import { AOIDetailPanel } from '../components/aoi/AOIDetailPanel'
import { QuerySearch } from '../components/search/QuerySearch'
import { AnalystProvider, useAnalyst } from '../contexts/AnalystContext'
import { useAuth } from '../contexts/AuthContext'

function AnalystToasts() {
  const { toast, hideToast } = useAnalyst()
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

export function AnalystView() {
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const { logout } = useAuth()

  return (
    <AnalystProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header userRole="analyst" onLogout={logout} />
        <ThreeColumnLayout
          leftOpen={leftOpen}
          onToggleLeft={() => setLeftOpen((open) => !open)}
          rightOpen={rightOpen}
          onToggleRight={() => setRightOpen((open) => !open)}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <QuerySearch />
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <MapContainer />
            </Box>
            <AOIDetailPanel />
          </Box>
        </ThreeColumnLayout>
      </Box>
      <AnalystToasts />
    </AnalystProvider>
  )
}
