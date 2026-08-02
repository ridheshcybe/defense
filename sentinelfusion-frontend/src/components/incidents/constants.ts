import {
  Campaign,
  DirectionsCar,
  GpsFixed,
  Groups,
  Help,
  LocalShipping,
  Park,
  Security,
  Visibility,
  Warning,
} from '@mui/icons-material'
import type {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  Modality,
  TriageLabel,
} from '../../types'

export const SEVERITY_COLORS: Record<IncidentSeverity, 'success' | 'warning' | 'error'> = {
  info: 'success',
  warning: 'warning',
  critical: 'error',
}

export const TYPE_LABELS: Record<IncidentType, string> = {
  protest: 'Protest',
  threat: 'Threat',
  unusual_movement: 'Unusual Movement',
  drug_shipment: 'Drug Shipment',
  weapons: 'Weapons',
  gathering: 'Gathering',
  intrusion: 'Intrusion',
  suspicious_activity: 'Suspicious Activity',
  environmental: 'Environmental',
  other: 'Other',
}

export const TYPE_ICONS: Record<IncidentType, typeof Campaign> = {
  protest: Campaign,
  threat: Warning,
  unusual_movement: DirectionsCar,
  drug_shipment: LocalShipping,
  weapons: Security,
  gathering: Groups,
  intrusion: GpsFixed,
  suspicious_activity: Visibility,
  environmental: Park,
  other: Help,
}

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
}

export const TRIAGE_LABELS: Record<TriageLabel, string> = {
  ignore: 'Ignore',
  watch: 'Watch',
  escalate: 'Escalate',
}

export const MODALITY_LABELS: Record<Modality, string> = {
  satellite: 'Satellite',
  webcam: 'Webcam',
  news: 'News',
}

export const SEVERITY_OPTIONS: Array<{ value: 'all' | IncidentSeverity; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
]
