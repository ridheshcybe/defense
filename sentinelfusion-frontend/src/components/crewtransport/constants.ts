import { CheckCircle, LocalShipping, PendingActions } from '@mui/icons-material'
import type { TransportStatus } from '../../types'

export const TRANSPORT_STATUS_LABELS: Record<TransportStatus, string> = {
  planned: 'Planned',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

export const TRANSPORT_STATUS_COLORS: Record<TransportStatus, 'default' | 'info' | 'success'> = {
  planned: 'default',
  'in-progress': 'info',
  completed: 'success',
}

export const TRANSPORT_STATUS_ICONS: Record<TransportStatus, typeof CheckCircle> = {
  planned: PendingActions,
  'in-progress': LocalShipping,
  completed: CheckCircle,
}
