import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from '@mui/lab'
import { AddCircle, AssignmentInd, NoteAdd, SwapHoriz } from '@mui/icons-material'
import { Typography } from '@mui/material'
import type { Incident, IncidentActivity } from '../../types'

const ACTIVITY_META: Record<
  IncidentActivity['type'],
  { icon: typeof SwapHoriz; color: 'primary' | 'warning' | 'info' | 'grey' }
> = {
  created: { icon: AddCircle, color: 'primary' },
  status: { icon: SwapHoriz, color: 'warning' },
  assigned: { icon: AssignmentInd, color: 'info' },
  note: { icon: NoteAdd, color: 'grey' },
}

export function IncidentTimeline({ incident }: { incident: Incident }) {
  if (incident.activityLog.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No activity recorded yet.
      </Typography>
    )
  }

  return (
    <Timeline sx={{ p: 0, m: 0 }}>
      {incident.activityLog.map((event) => {
        const meta = ACTIVITY_META[event.type]
        const Icon = meta.icon
        return (
          <TimelineItem key={event.id}>
            <TimelineSeparator>
              <TimelineDot color={meta.color}>
                <Icon fontSize="small" />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="body2">{event.description}</Typography>
              <Typography variant="caption" color="text.secondary">
                {event.timestamp}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
