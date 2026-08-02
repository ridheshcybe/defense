import { Avatar, List, ListItem, ListItemAvatar, ListItemText, Paper, Typography } from '@mui/material'
import {
  AddCircle,
  AddLocationAlt,
  Edit,
  MilitaryTech,
  SwapHoriz,
} from '@mui/icons-material'
import type { Activity, ActivityType } from '../../types'
import { timeAgo } from '../../utils/time'

const ACTIVITY_ICONS: Record<ActivityType, typeof SwapHoriz> = {
  incident_created: AddCircle,
  incident_status: SwapHoriz,
  aoi_added: AddLocationAlt,
  aoi_updated: Edit,
  mission_completed: MilitaryTech,
}

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  incident_created: '#1976d2',
  incident_status: '#f57c00',
  aoi_added: '#2e7d32',
  aoi_updated: '#7b1fa2',
  mission_completed: '#00695c',
}

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Typography variant="subtitle2" sx={{ px: 1, pt: 1 }}>
        Recent Activity
      </Typography>
      <List dense>
        {activities.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.type]
          return (
            <ListItem key={activity.id} alignItems="flex-start" data-testid={`activity-${activity.id}`}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: ACTIVITY_COLORS[activity.type], width: 28, height: 28 }}>
                  <Icon fontSize="small" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={activity.description}
                secondary={`${activity.user} · ${timeAgo(activity.timestamp)}`}
              />
            </ListItem>
          )
        })}
      </List>
    </Paper>
  )
}
