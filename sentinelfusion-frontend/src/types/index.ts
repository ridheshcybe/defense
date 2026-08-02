export interface LatLng {
  lat: number
  lng: number
}

export interface MapCenter {
  lat: number
  lng: number
  zoom?: number
}

export type AOITier = 1 | 2 | 3 | 4

export type AOIStatus = 'active' | 'monitoring' | 'standby' | 'archived'

export interface AOI {
  id: string
  name: string
  status: AOIStatus
  tier: AOITier
  center: LatLng
  geometry: LatLng[]
  lastUpdated: string
  incidentCount: number
  description?: string
  tags: string[]
}

export interface CreateAOIDTO {
  name: string
  center: LatLng
  description?: string
  tags: string[]
}

export type UpdateAOIDTO = Partial<CreateAOIDTO>

export type IncidentType =
  | 'protest'
  | 'threat'
  | 'unusual_movement'
  | 'drug_shipment'
  | 'weapons'
  | 'gathering'
  | 'intrusion'
  | 'suspicious_activity'
  | 'environmental'
  | 'other'

export type IncidentSeverity = 'info' | 'warning' | 'critical'

export type IncidentStatus = 'open' | 'in-progress' | 'resolved'

export type TriageLabel = 'ignore' | 'watch' | 'escalate'

export type Modality = 'satellite' | 'webcam' | 'news'

export interface Incident {
  id: string
  aoiId: string
  type: IncidentType
  severity: IncidentSeverity
  timestamp: string
  location: LatLng
  description: string
  status: IncidentStatus
  triageLabel: TriageLabel
  modalitiesUsed: Modality[]
  entityIds: string[]
  groupTags: string[]
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  activityLog: IncidentActivity[]
}

export interface IncidentActivity {
  id: string
  timestamp: string
  type: 'created' | 'status' | 'assigned' | 'note'
  description: string
  from?: string
  to?: string
  actor?: string
}

export interface FieldOpsUser {
  id: string
  name: string
}

export type TransportStatus = 'planned' | 'in-progress' | 'completed'

export interface TransportRouteStop {
  name: string
  lat: number
  lng: number
}

export interface TransportAssignment {
  id: string
  routeName: string
  origin: string
  destination: string
  status: TransportStatus
  etaMinutes: number
  assignedTo: string | null
  vehicle: string
  stops: TransportRouteStop[]
  notes: string[]
  updatedAt: string
}

export interface CreateIncidentDTO {
  type: IncidentType
  severity: IncidentSeverity
  location: LatLng
  description: string
  aoiId: string
  tags: string[]
}

export type UpdateIncidentDTO = Partial<CreateIncidentDTO>

export type ZoneType = 'heatmap' | 'no-go' | 'target'

export interface Zone {
  id: string
  aoiId: string
  type: ZoneType
  geometry: LatLng[]
  severityScore: number
  validFrom: string
  validUntil: string
  sourceIncidentIds: string[]
}

export interface Entity {
  id: string
  type: 'person' | 'org' | 'asset'
  name: string
}

export interface Group {
  id: string
  tag: string
  description: string
  riskLevel: 'low' | 'medium' | 'high'
}

export type UserRole = 'analyst' | 'field_ops' | 'leadership' | 'crew_transport'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom'

export interface DateRange {
  preset: DateRangePreset
  from: string // ISO date 'YYYY-MM-DD'
  to: string
}

export interface LeadershipStats {
  totalAOIs: number
  activeIncidents: number
  activeIncidentsTrend: number // % vs previous period (+ up / − down)
  avgResponseHours: number
  resolvedIncidents: number
  resolutionRate: number // 0-100
  fieldOpsActive: number
  criticalIncidents: number
}

export interface IncidentTypeCount {
  type: IncidentType
  count: number
}

export interface SeveritySlice {
  severity: IncidentSeverity
  count: number
}

export interface TrendPoint {
  date: string // 'YYYY-MM-DD'
  count: number
}

export type ActivityType =
  | 'incident_created'
  | 'incident_status'
  | 'aoi_added'
  | 'aoi_updated'
  | 'mission_completed'

export interface Activity {
  id: string
  timestamp: string
  type: ActivityType
  description: string
  user: string
}

export interface LeadershipData {
  stats: LeadershipStats
  incidentsByType: IncidentTypeCount[]
  severityDistribution: SeveritySlice[]
  incidentTrend: TrendPoint[]
  activities: Activity[]
}

/** Result of the multimodal AI pipeline (ai/api/inference.py POST /predict). */
export interface AIPrediction {
  incident_type: IncidentType
  severity: IncidentSeverity
  confidence: number // 0..1
  confidence_interval?: [number, number]
  latency_ms?: number
}

export type WarehouseType = 'snowflake' | 'databricks'

export interface AOIDefinition {
  id: string
  name: string
  lat: number
  lng: number
  tier: AOITier
}

/** Maps source warehouse columns onto SentinelFusion ontology fields. */
export interface ColumnMapping {
  time: string
  entity_id: string
  group_tag: string
  location: string
  severity: string
  description: string
}

/** Role → user ids assigned during onboarding. */
export type RoleAssignments = Record<UserRole, string[]>

/** Complete state of the T29 onboarding wizard. */
export interface OnboardingFormData {
  warehouseType: WarehouseType
  warehouseUrl: string
  warehouseUser: string
  warehousePassword: string
  eventTable: string
  entityTable: string
  aois: AOIDefinition[]
  columnMapping: ColumnMapping
  roleAssignments: RoleAssignments
}
