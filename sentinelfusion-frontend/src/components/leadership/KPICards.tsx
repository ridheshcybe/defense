import { Card, Chip, Stack, Typography } from '@mui/material'
import {
  DoneAll,
  Insights,
  MyLocation,
  Sensors,
  TimerOutlined,
  TrendingDown,
  TrendingUp,
  Warning,
} from '@mui/icons-material'
import type { ReactNode } from 'react'
import type { LeadershipStats } from '../../types'

interface TrendProps {
  value: number
}

function Trend({ value }: TrendProps) {
  const up = value >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<Icon />}
      color={up ? 'success' : 'error'}
      label={`${up ? '+' : ''}${value}%`}
    />
  )
}

interface KpiCard {
  label: string
  value: string | number
  icon: ReactNode
  trend: number | null
}

interface KPICardsProps {
  stats: LeadershipStats
}

export function KPICards({ stats }: KPICardsProps) {
  const cards: KpiCard[] = [
    { label: 'Total AOIs', value: stats.totalAOIs, icon: <MyLocation color="primary" />, trend: null },
    { label: 'Active Incidents', value: stats.activeIncidents, icon: <Insights color="info" />, trend: stats.activeIncidentsTrend },
    { label: 'Avg Response Time', value: `${stats.avgResponseHours}h`, icon: <TimerOutlined color="warning" />, trend: null },
    { label: 'Incidents Resolved', value: `${stats.resolvedIncidents} (${stats.resolutionRate}%)`, icon: <DoneAll color="success" />, trend: null },
    { label: 'Field Ops Active', value: stats.fieldOpsActive, icon: <Sensors color="secondary" />, trend: null },
    { label: 'Critical Incidents', value: stats.criticalIncidents, icon: <Warning color="error" />, trend: null },
  ]

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }}>
      {cards.map((card) => (
        <Card
          key={card.label}
          variant="outlined"
          data-testid={`kpi-${card.label.toLowerCase().replace(/\s+/g, '-')}`}
          sx={{
            flex: '1 1 150px',
            p: 1.5,
            ...(card.label === 'Critical Incidents' && {
              borderColor: 'error.main',
              bgcolor: 'error.light',
            }),
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            {card.icon}
            {card.trend !== null && <Trend value={card.trend} />}
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
            {card.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {card.label}
          </Typography>
        </Card>
      ))}
    </Stack>
  )
}
