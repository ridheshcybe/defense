import { MOCK_FIELD_OPS_USERS, MOCK_INCIDENTS } from '../data/mockData'
import { STATUS_LABELS } from '../components/incidents/constants'
import type {
  CreateIncidentDTO,
  Incident,
  IncidentActivity,
  IncidentStatus,
  UpdateIncidentDTO,
} from '../types'

const SIMULATED_DELAY_MS = 500

// In-memory store seeded from mock data so CRUD works against a stable list.
// Swap the bodies for real fetch (POST/PUT/DELETE /incidents) when the backend exists.
let incidentStore: Incident[] = [...MOCK_INCIDENTS]
let idCounter = 1000
let activityCounter = 0

async function simulate<T>(producer: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))
  return producer()
}

function activity(
  type: IncidentActivity['type'],
  description: string,
  extra: Partial<IncidentActivity> = {},
): IncidentActivity {
  return { id: `act-${++activityCounter}`, timestamp: 'just now', type, description, ...extra }
}

/** Read path returns the in-memory store (mock), filtered by AOI when provided. */
export async function fetchIncidents(aoiId: string | null): Promise<Incident[]> {
  return aoiId ? incidentStore.filter((incident) => incident.aoiId === aoiId) : [...incidentStore]
}

export async function createIncident(data: CreateIncidentDTO): Promise<Incident> {
  return simulate(() => {
    const incident: Incident = {
      id: `inc-${++idCounter}`,
      aoiId: data.aoiId,
      type: data.type,
      severity: data.severity,
      timestamp: 'just now',
      createdAt: 'just now',
      updatedAt: 'just now',
      location: data.location,
      description: data.description,
      status: 'open',
      triageLabel: 'watch',
      modalitiesUsed: [],
      entityIds: [],
      groupTags: data.tags,
      assignedTo: null,
      activityLog: [activity('created', 'Incident created')],
    }
    incidentStore = [incident, ...incidentStore]
    return incident
  })
}

export async function updateIncident(id: string, data: UpdateIncidentDTO): Promise<Incident> {
  return simulate(() => {
    const index = incidentStore.findIndex((incident) => incident.id === id)
    if (index === -1) throw new Error('Incident not found')
    const { tags, ...rest } = data
    const current = incidentStore[index]
    const updated: Incident = {
      ...current,
      ...rest,
      groupTags: tags ?? current.groupTags,
      updatedAt: 'just now',
      activityLog: [...current.activityLog, activity('note', 'Incident details updated')],
    }
    incidentStore = incidentStore.map((incident) => (incident.id === id ? updated : incident))
    return updated
  })
}

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  return simulate(() => {
    const index = incidentStore.findIndex((incident) => incident.id === id)
    if (index === -1) throw new Error('Incident not found')
    const current = incidentStore[index]
    const updated: Incident = {
      ...current,
      status,
      updatedAt: 'just now',
      activityLog: [
        ...current.activityLog,
        activity(
          'status',
          `Status changed: ${STATUS_LABELS[current.status]} → ${STATUS_LABELS[status]}`,
          { from: current.status, to: status },
        ),
      ],
    }
    incidentStore = incidentStore.map((incident) => (incident.id === id ? updated : incident))
    return updated
  })
}

export async function assignIncident(id: string, userId: string | null): Promise<Incident> {
  return simulate(() => {
    const index = incidentStore.findIndex((incident) => incident.id === id)
    if (index === -1) throw new Error('Incident not found')
    const current = incidentStore[index]
    const user = userId ? MOCK_FIELD_OPS_USERS.find((u) => u.id === userId) : undefined
    const updated: Incident = {
      ...current,
      assignedTo: userId,
      updatedAt: 'just now',
      activityLog: [
        ...current.activityLog,
        activity('assigned', userId ? `Assigned to ${user?.name ?? userId}` : 'Unassigned', {
          actor: userId ?? undefined,
        }),
      ],
    }
    incidentStore = incidentStore.map((incident) => (incident.id === id ? updated : incident))
    return updated
  })
}

export async function deleteIncident(id: string): Promise<void> {
  return simulate(() => {
    incidentStore = incidentStore.filter((incident) => incident.id !== id)
  })
}

/** Test helper: resets the in-memory store to the original mock seed. */
export function resetIncidentStore(): void {
  incidentStore = [...MOCK_INCIDENTS]
  idCounter = 1000
  activityCounter = 0
}
