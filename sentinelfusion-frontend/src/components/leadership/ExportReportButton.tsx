import { useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import { Download } from '@mui/icons-material'
import type { DateRange, LeadershipData } from '../../types'
import { exportLeadershipReport } from '../../utils/report'

interface ExportReportButtonProps {
  data: LeadershipData
  dateRange: DateRange
}

export function ExportReportButton({ data, dateRange }: ExportReportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportLeadershipReport(data, dateRange)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <Download />}
      onClick={handleExport}
      disabled={exporting}
      data-testid="export-report-button"
    >
      {exporting ? 'Exporting…' : 'Export Report'}
    </Button>
  )
}
