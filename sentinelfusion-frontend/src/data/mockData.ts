import type { AOI, Entity, FieldOpsUser, Group, Incident, TransportAssignment, Zone } from '../types'

export const MOCK_AOIS: AOI[] = [
  {
    id: 'aoi-1',
    name: 'Mumbai Central',
    status: 'active',
    tier: 1,
    center: { lat: 18.9695, lng: 72.8199 },
    geometry: [
      { lat: 18.9545, lng: 72.8059 },
      { lat: 18.9845, lng: 72.8059 },
      { lat: 18.9845, lng: 72.8339 },
      { lat: 18.9545, lng: 72.8339 },
    ],
    lastUpdated: '2 min ago',
    incidentCount: 4,
    description: 'High-priority transit hub with mixed foot traffic.',
    tags: ['tier-1', 'urban', 'transit'],
  },
  {
    id: 'aoi-2',
    name: 'Bandra West',
    status: 'monitoring',
    tier: 2,
    center: { lat: 19.0596, lng: 72.8295 },
    geometry: [
      { lat: 19.0446, lng: 72.8155 },
      { lat: 19.0746, lng: 72.8155 },
      { lat: 19.0746, lng: 72.8435 },
      { lat: 19.0446, lng: 72.8435 },
    ],
    lastUpdated: '14 min ago',
    incidentCount: 2,
    description: 'Coastal locality with nightlife density.',
    tags: ['tier-2', 'coastal'],
  },
  {
    id: 'aoi-3',
    name: 'Colaba Causeway',
    status: 'active',
    tier: 1,
    center: { lat: 18.9218, lng: 72.8325 },
    geometry: [
      { lat: 18.9068, lng: 72.8185 },
      { lat: 18.9368, lng: 72.8185 },
      { lat: 18.9368, lng: 72.8465 },
      { lat: 18.9068, lng: 72.8465 },
    ],
    lastUpdated: '1 min ago',
    incidentCount: 5,
    description: 'Waterfront corridor; known smuggling risk.',
    tags: ['tier-1', 'waterfront', 'critical-site'],
  },
  {
    id: 'aoi-4',
    name: 'Andheri East',
    status: 'standby',
    tier: 3,
    center: { lat: 19.1136, lng: 72.8697 },
    geometry: [
      { lat: 19.0986, lng: 72.8557 },
      { lat: 19.1286, lng: 72.8557 },
      { lat: 19.1286, lng: 72.8837 },
      { lat: 19.0986, lng: 72.8837 },
    ],
    lastUpdated: '48 min ago',
    incidentCount: 1,
    description: 'Warehouse district east of the airport.',
    tags: ['tier-3', 'industrial'],
  },
  {
    id: 'aoi-5',
    name: 'Navi Mumbai',
    status: 'archived',
    tier: 4,
    center: { lat: 19.033, lng: 73.0297 },
    geometry: [
      { lat: 19.018, lng: 73.0157 },
      { lat: 19.048, lng: 73.0157 },
      { lat: 19.048, lng: 73.0437 },
      { lat: 19.018, lng: 73.0437 },
    ],
    lastUpdated: '3 days ago',
    incidentCount: 0,
    description: 'Archived greenfield expansion zone.',
    tags: ['tier-4', 'archived'],
  },
]

export const MOCK_ENTITIES: Entity[] = [
  { id: 'ent-1', type: 'person', name: 'Rahul Verma' },
  { id: 'ent-2', type: 'org', name: 'Lashkar-linked cell' },
  { id: 'ent-3', type: 'asset', name: 'MV Horizon Star' },
  { id: 'ent-4', type: 'person', name: 'Imran Shaikh' },
  { id: 'ent-5', type: 'org', name: 'Azad Maidan network' },
  { id: 'ent-6', type: 'asset', name: 'Freight yard B-4' },
]

export const MOCK_GROUPS: Group[] = [
  { id: 'grp-1', tag: 'Terrorist-related', description: 'Suspected terror-linked groups', riskLevel: 'high' },
  { id: 'grp-2', tag: 'Protest groups', description: 'Organised demonstration networks', riskLevel: 'medium' },
  { id: 'grp-3', tag: 'Smuggling network', description: 'Drug and contraband smuggling rings', riskLevel: 'high' },
]

export const MOCK_FIELD_OPS_USERS: FieldOpsUser[] = [
  { id: 'user-1', name: 'Asha Nair' },
  { id: 'user-2', name: 'Vikram Rao' },
  { id: 'user-3', name: 'Diana Okonkwo' },
]

export const MOCK_CREW_USERS: FieldOpsUser[] = [
  { id: 'crew-1', name: 'Kabir Rao' },
  { id: 'crew-2', name: 'Meera Iyer' },
]

/** Mock warehouse tables offered by the T29 onboarding wizard. */
export const MOCK_ONBOARDING_TABLES = {
  eventTables: ['sf_fusion_events', 'dbx_events', 'events_v2'],
  entityTables: ['sf_entities', 'dbx_entities', 'entities_v2'],
}

/** Mock users assignable to roles during onboarding. */
export const MOCK_ONBOARDING_USERS: Array<{ id: string; name: string; email: string }> = [
  { id: 'u-1', name: 'Aria Singh', email: 'aria@fusion.dev' },
  { id: 'u-2', name: 'Dev Patel', email: 'dev@fusion.dev' },
  { id: 'u-3', name: 'Rhea Menon', email: 'rhea@fusion.dev' },
  { id: 'u-4', name: 'Kabir Rao', email: 'kabir@fusion.dev' },
]

/** Mock source columns offered by the column-mapping step. */
export const MOCK_ONBOARDING_COLUMNS = [
  'event_ts',
  'occurred_at',
  'entity_id',
  'group_tag',
  'lat',
  'lng',
  'severity',
  'description',
]

export const MOCK_TRANSPORT_ASSIGNMENTS: TransportAssignment[] = [
  {
    id: 'tr-1',
    routeName: 'Colaba Supply Run',
    origin: 'Fusion HQ, Fort',
    destination: 'Colaba Causeway AOI',
    status: 'planned',
    etaMinutes: 42,
    assignedTo: 'crew-1',
    vehicle: 'Truck T-7',
    stops: [
      { name: 'Fusion HQ', lat: 18.9337, lng: 72.8327 },
      { name: 'CST', lat: 18.9398, lng: 72.8355 },
      { name: 'Colaba Causeway', lat: 18.9218, lng: 72.8325 },
    ],
    notes: [],
    updatedAt: '2026-08-01 14:10',
  },
  {
    id: 'tr-2',
    routeName: 'Bandra Relief Pickup',
    origin: 'Bandra West Depot',
    destination: 'Andheri East',
    status: 'in-progress',
    etaMinutes: 18,
    assignedTo: 'crew-1',
    vehicle: 'Van V-2',
    stops: [
      { name: 'Bandra West', lat: 19.0596, lng: 72.8295 },
      { name: 'Khar', lat: 19.0722, lng: 72.8339 },
      { name: 'Andheri East', lat: 19.1136, lng: 72.8697 },
    ],
    notes: ['Traffic clear on Western Express Hwy'],
    updatedAt: '2026-08-01 13:40',
  },
  {
    id: 'tr-3',
    routeName: 'Navi Mumbai Courier',
    origin: 'Fusion HQ, Fort',
    destination: 'Navi Mumbai Depot',
    status: 'completed',
    etaMinutes: 0,
    assignedTo: 'crew-1',
    vehicle: 'Bike B-1',
    stops: [
      { name: 'Fusion HQ', lat: 18.9337, lng: 72.8327 },
      { name: 'Vashi', lat: 19.0759, lng: 72.9966 },
      { name: 'Navi Mumbai', lat: 19.033, lng: 73.0297 },
    ],
    notes: ['Delivered at 11:20'],
    updatedAt: '2026-08-01 11:25',
  },
  {
    id: 'tr-4',
    routeName: 'Colaba Crowd Support',
    origin: 'Mahalaxmi Depot',
    destination: 'Colaba Causeway AOI',
    status: 'planned',
    etaMinutes: 55,
    assignedTo: null,
    vehicle: 'Truck T-3',
    stops: [
      { name: 'Mahalaxmi', lat: 18.9825, lng: 72.8127 },
      { name: 'Churchgate', lat: 18.9322, lng: 72.8266 },
      { name: 'Colaba Causeway', lat: 18.9218, lng: 72.8325 },
    ],
    notes: [],
    updatedAt: '2026-08-01 14:05',
  },
]

type BaseIncident = Omit<Incident, 'assignedTo' | 'createdAt' | 'updatedAt' | 'activityLog'>

const baseIncidents: BaseIncident[] = [
  {
    id: 'inc-1',
    aoiId: 'aoi-3',
    type: 'threat',
    severity: 'critical',
    timestamp: '2026-08-01 14:30',
    location: { lat: 18.9218, lng: 72.8347 },
    description:
      'Armed individuals gathering near the waterfront; thermal anomaly and webcam motion confirmed.',
    status: 'open',
    triageLabel: 'escalate',
    modalitiesUsed: ['satellite', 'webcam'],
    entityIds: ['ent-1', 'ent-2'],
    groupTags: ['Terrorist-related'],
  },
  {
    id: 'inc-2',
    aoiId: 'aoi-2',
    type: 'unusual_movement',
    severity: 'warning',
    timestamp: '2026-08-01 13:10',
    location: { lat: 19.0596, lng: 72.8295 },
    description: 'Coordinated convoy of 6+ unmarked vehicles deviating from normal traffic patterns.',
    status: 'in-progress',
    triageLabel: 'watch',
    modalitiesUsed: ['satellite', 'webcam'],
    entityIds: ['ent-4'],
    groupTags: ['Smuggling network'],
  },
  {
    id: 'inc-3',
    aoiId: 'aoi-1',
    type: 'protest',
    severity: 'warning',
    timestamp: '2026-08-01 11:45',
    location: { lat: 18.9322, lng: 72.8266 },
    description:
      'Crowd exceeding 500 at Azad Maidan; social media corroborates planned demonstration.',
    status: 'in-progress',
    triageLabel: 'watch',
    modalitiesUsed: ['webcam', 'news'],
    entityIds: ['ent-5'],
    groupTags: ['Protest groups'],
  },
  {
    id: 'inc-4',
    aoiId: 'aoi-3',
    type: 'drug_shipment',
    severity: 'critical',
    timestamp: '2026-08-01 09:20',
    location: { lat: 18.9218, lng: 72.8325 },
    description:
      'Night-vision satellite shows small boat rendezvous with container vessel; matches known smuggling MO.',
    status: 'open',
    triageLabel: 'escalate',
    modalitiesUsed: ['satellite', 'news'],
    entityIds: ['ent-3'],
    groupTags: ['Smuggling network'],
  },
  {
    id: 'inc-5',
    aoiId: 'aoi-4',
    type: 'gathering',
    severity: 'info',
    timestamp: '2026-08-01 08:05',
    location: { lat: 19.1136, lng: 72.8697 },
    description: 'Elevated foot traffic near market; no hostile indicators detected.',
    status: 'resolved',
    triageLabel: 'ignore',
    modalitiesUsed: ['webcam'],
    entityIds: [],
    groupTags: [],
  },
  {
    id: 'inc-6',
    aoiId: 'aoi-1',
    type: 'weapons',
    severity: 'critical',
    timestamp: '2026-07-31 22:40',
    location: { lat: 18.9695, lng: 72.8199 },
    description:
      'Unconfirmed report of weapons cache movement near freight yard; radar signature under review.',
    status: 'open',
    triageLabel: 'escalate',
    modalitiesUsed: ['satellite', 'news'],
    entityIds: ['ent-6', 'ent-2'],
    groupTags: ['Terrorist-related'],
  },
  {
    id: 'inc-7',
    aoiId: 'aoi-1',
    type: 'protest',
    severity: 'info',
    timestamp: '2026-07-31 18:30',
    location: { lat: 18.9322, lng: 72.8266 },
    description: 'Small gathering dispersed peacefully; no escalation.',
    status: 'resolved',
    triageLabel: 'ignore',
    modalitiesUsed: ['news'],
    entityIds: [],
    groupTags: [],
  },
  {
    id: 'inc-8',
    aoiId: 'aoi-5',
    type: 'unusual_movement',
    severity: 'warning',
    timestamp: '2026-07-31 16:15',
    location: { lat: 19.033, lng: 73.0297 },
    description: 'Unusual vessel track in creek; awaiting AIS confirmation.',
    status: 'in-progress',
    triageLabel: 'watch',
    modalitiesUsed: ['satellite'],
    entityIds: ['ent-3'],
    groupTags: ['Smuggling network'],
  },
]

const seededIncident = (incident: BaseIncident): Incident => ({
  ...incident,
  assignedTo: null,
  createdAt: incident.timestamp,
  updatedAt: incident.timestamp,
  activityLog: [
    {
      id: `act-${incident.id}-created`,
      timestamp: incident.timestamp,
      type: 'created',
      description: 'Incident created',
    },
  ],
})

// A couple of richer examples so detail panels show status/assignment/note events too.
const ENRICHED_INCIDENTS: Partial<Record<string, Partial<Incident>>> = {
  'inc-2': {
    assignedTo: 'user-1',
    updatedAt: '2026-08-01 14:02',
    activityLog: [
      { id: 'act-inc-2-created', timestamp: '2026-08-01 13:10', type: 'created', description: 'Incident created' },
      {
        id: 'act-inc-2-status',
        timestamp: '2026-08-01 13:55',
        type: 'status',
        from: 'open',
        to: 'in-progress',
        description: 'Status changed: Open → In Progress',
      },
      {
        id: 'act-inc-2-assigned',
        timestamp: '2026-08-01 14:02',
        type: 'assigned',
        actor: 'user-1',
        description: 'Assigned to Asha Nair',
      },
    ],
  },
  'inc-4': {
    assignedTo: 'user-2',
    updatedAt: '2026-08-01 10:05',
    activityLog: [
      { id: 'act-inc-4-created', timestamp: '2026-08-01 09:20', type: 'created', description: 'Incident created' },
      { id: 'act-inc-4-note', timestamp: '2026-08-01 10:05', type: 'note', description: 'Satellite revisit scheduled' },
    ],
  },
}

export const MOCK_INCIDENTS: Incident[] = baseIncidents.map((incident) => ({
  ...seededIncident(incident),
  ...ENRICHED_INCIDENTS[incident.id],
}))

export const MOCK_ZONES: Zone[] = [
  {
    id: 'zone-1',
    aoiId: 'aoi-3',
    type: 'heatmap',
    geometry: [
      { lat: 18.9148, lng: 72.8285 },
      { lat: 18.9288, lng: 72.8285 },
      { lat: 18.9288, lng: 72.8405 },
      { lat: 18.9148, lng: 72.8405 },
    ],
    severityScore: 82,
    validFrom: '2026-08-01 10:00',
    validUntil: '2026-08-02 10:00',
    sourceIncidentIds: ['inc-1', 'inc-4'],
  },
  {
    id: 'zone-2',
    aoiId: 'aoi-3',
    type: 'no-go',
    geometry: [
      { lat: 18.9198, lng: 72.8315 },
      { lat: 18.9268, lng: 72.8315 },
      { lat: 18.9268, lng: 72.8375 },
      { lat: 18.9198, lng: 72.8375 },
    ],
    severityScore: 91,
    validFrom: '2026-08-01 12:00',
    validUntil: '2026-08-02 12:00',
    sourceIncidentIds: ['inc-1'],
  },
  {
    id: 'zone-3',
    aoiId: 'aoi-1',
    type: 'target',
    geometry: [
      { lat: 18.9605, lng: 72.8139 },
      { lat: 18.9785, lng: 72.8139 },
      { lat: 18.9785, lng: 72.8259 },
      { lat: 18.9605, lng: 72.8259 },
    ],
    severityScore: 74,
    validFrom: '2026-07-31 23:00',
    validUntil: '2026-08-02 23:00',
    sourceIncidentIds: ['inc-6'],
  },
  {
    id: 'zone-4',
    aoiId: 'aoi-2',
    type: 'heatmap',
    geometry: [
      { lat: 19.0526, lng: 72.8235 },
      { lat: 19.0666, lng: 72.8235 },
      { lat: 19.0666, lng: 72.8355 },
      { lat: 19.0526, lng: 72.8355 },
    ],
    severityScore: 61,
    validFrom: '2026-08-01 13:00',
    validUntil: '2026-08-02 13:00',
    sourceIncidentIds: ['inc-2'],
  },
  {
    id: 'zone-5',
    aoiId: 'aoi-4',
    type: 'no-go',
    geometry: [
      { lat: 19.1066, lng: 72.8637 },
      { lat: 19.1206, lng: 72.8637 },
      { lat: 19.1206, lng: 72.8757 },
      { lat: 19.1066, lng: 72.8757 },
    ],
    severityScore: 68,
    validFrom: '2026-08-01 08:00',
    validUntil: '2026-08-03 08:00',
    sourceIncidentIds: ['inc-5'],
  },
]
