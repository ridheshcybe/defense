import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Box, Typography } from '@mui/material'
import type { IncidentSeverity, SeveritySlice } from '../../types'

const SEVERITY_HEX: Record<IncidentSeverity, string> = {
  critical: '#d32f2f',
  warning: '#f57c00',
  info: '#1976d2',
}

interface SeverityDistributionChartProps {
  data: SeveritySlice[]
}

export function SeverityDistributionChart({ data }: SeverityDistributionChartProps) {
  const rows = data.map((slice) => ({ name: slice.severity, value: slice.count }))

  return (
    <Box data-testid="severity-distribution-chart" sx={{ height: 260, width: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Severity Distribution
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
            {rows.map((row) => (
              <Cell key={row.name} fill={SEVERITY_HEX[row.name as IncidentSeverity]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  )
}
