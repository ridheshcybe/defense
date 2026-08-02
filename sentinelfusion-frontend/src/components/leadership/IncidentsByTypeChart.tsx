import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Box, Typography } from '@mui/material'
import type { IncidentTypeCount } from '../../types'
import { TYPE_LABELS } from '../incidents/constants'

interface IncidentsByTypeChartProps {
  data: IncidentTypeCount[]
}

export function IncidentsByTypeChart({ data }: IncidentsByTypeChartProps) {
  const rows = data.map((entry) => ({ name: TYPE_LABELS[entry.type], count: entry.count }))

  return (
    <Box data-testid="incidents-by-type-chart" sx={{ height: 260, width: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Incidents by Type
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
