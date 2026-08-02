import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Box, Typography } from '@mui/material'
import type { TrendPoint } from '../../types'

interface IncidentTrendChartProps {
  data: TrendPoint[]
}

export function IncidentTrendChart({ data }: IncidentTrendChartProps) {
  const rows = data.map((point) => ({ date: point.date.slice(5), count: point.count }))

  return (
    <Box data-testid="incident-trend-chart" sx={{ height: 260, width: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Incident Trend
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="count" stroke="#2e7d32" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
