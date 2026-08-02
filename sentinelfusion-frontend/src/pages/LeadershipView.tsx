import { Alert, Box, CircularProgress, Paper, Snackbar, Stack, Typography } from '@mui/material'
import { Header } from '../components/layout/Header'
import { KPICards } from '../components/leadership/KPICards'
import { IncidentsByTypeChart } from '../components/leadership/IncidentsByTypeChart'
import { SeverityDistributionChart } from '../components/leadership/SeverityDistributionChart'
import { IncidentTrendChart } from '../components/leadership/IncidentTrendChart'
import { ActivityFeed } from '../components/leadership/ActivityFeed'
import { DateRangeSelector } from '../components/leadership/DateRangeSelector'
import { ExportReportButton } from '../components/leadership/ExportReportButton'
import { ErrorState } from '../components/common/ErrorState'
import { LeadershipProvider, useLeadership } from '../contexts/LeadershipContext'
import { useAuth } from '../contexts/AuthContext'

function LeadershipToasts() {
  const { toast, hideToast } = useLeadership()
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

function LeadershipApp() {
  const {
    stats,
    incidentsByType,
    severityDistribution,
    incidentTrend,
    activities,
    dateRange,
    isLoading,
    error,
    fetchLeadershipData,
    refetch,
  } = useLeadership()
  const { logout } = useAuth()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress aria-label="Loading dashboard" />
      </Box>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header userRole="leadership" onLogout={logout} />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1 }}>
        <Stack spacing={1} sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="space-between">
            <DateRangeSelector value={dateRange} onChange={fetchLeadershipData} />
            <ExportReportButton
              data={{ stats, incidentsByType, severityDistribution, incidentTrend, activities }}
              dateRange={dateRange}
            />
          </Stack>

          <KPICards stats={stats} />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <Paper variant="outlined" sx={{ flex: 1, p: 1, minWidth: 0 }}>
              <IncidentsByTypeChart data={incidentsByType} />
            </Paper>
            <Paper variant="outlined" sx={{ flex: 1, p: 1, minWidth: 0 }}>
              <SeverityDistributionChart data={severityDistribution} />
            </Paper>
          </Stack>

          <Paper variant="outlined" sx={{ p: 1 }}>
            <IncidentTrendChart data={incidentTrend} />
          </Paper>

          {activities.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No activity in this range.
              </Typography>
            </Paper>
          ) : (
            <ActivityFeed activities={activities} />
          )}
        </Stack>
      </Box>
      <LeadershipToasts />
    </Box>
  )
}

export function LeadershipView() {
  return (
    <LeadershipProvider>
      <LeadershipApp />
    </LeadershipProvider>
  )
}
