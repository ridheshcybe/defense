import { MOCK_FIELD_OPS_USERS, MOCK_INCIDENTS } from '../data/mockData'
import { STATUS_LABELS } from '../components/incidents/constants'
import type { Incident, IncidentActivity, IncidentStatus } from '../types'

const SIMULATED_DELAY_MS = 300

// Extra incidents seeded as assigned to field-ops user-1 (Asha Nair) so the
// operator's queue is populated. Kept local to this store so the Analyst view
// and its tests are unaffected.
const QUEUE_SEED: Record<string, { assignedTo: string }> = {
  'inc-3': { assignedTo: 'user-1' },
  'inc-6': { assignedTo: 'user-1' },
}

let incidentStore: Incident[] = MOCK_INCIDENTS.map((incident) => {
  const seed = QUEUE_SEED[incident.id]
  if (!seed) return incident
  return {
    ...incident,
    assignedTo: seed.assignedTo,
    activityLog: [
      ...incident.activityLog,
      {
        id: `act-${incident.id}-assign`,
        timestamp: incident.timestamp,
        type: 'assigned',
        actor: 'user-1',
        description: 'Assigned to Asha Nair',
      },
    ],
  }
})
let activityCounter = 1000

async function simulate<T>(producer: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))
  return producer()
}

function activity(
  type: IncidentActivity['type'],
  description: string,
  extra: Partial<IncidentActivity> = {},
): IncidentActivity {
  return { id: `act-fo-${++activityCounter}`, timestamp: 'just now', type, description, ...extra }
}

/**
 * The operator's work queue: incidents assigned to the user plus open unassigned
 * ones (available for pickup). Resolved incidents drop out unless assigned to the user.
 */
export async function fetchIncidentQueue(userId: string): Promise<Incident[]> {
  return simulate(() =>
    incidentStore.filter(
      (incident) =>
        incident.assignedTo === userId ||
        (incident.assignedTo === null && incident.status !== 'resolved'),
    ),
  )
}

/** Strict view: incidents assigned to this user. */
export async function fetchAssignedIncidents(userId: string): Promise<Incident[]> {
  return simulate(() => incidentStore.filter((incident) => incident.assignedTo === userId))
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
        activity('status', `Status changed: ${STATUS_LABELS[current.status]} → ${STATUS_LABELS[status]}`, {
          from: current.status,
          to: status,
        }),
      ],
    }
    incidentStore = incidentStore.map((incident) => (incident.id === id ? updated : incident))
    return updated
  })
}

export async function addNote(id: string, note: string): Promise<Incident> {
  return simulate(() => {
    const index = incidentStore.findIndex((incident) => incident.id === id)
    if (index === -1) throw new Error('Incident not found')
    const current = incidentStore[index]
    const updated: Incident = {
      ...current,
      updatedAt: 'just now',
      activityLog: [...current.activityLog, activity('note', note)],
    }
    incidentStore = incidentStore.map((incident) => (incident.id === id ? updated : incident))
    return updated
  })
}

/** Test helper: resets the in-memory store to the seeded mock. */
export function resetFieldOpsStore(): void {
  incidentStore = MOCK_INCIDENTS.map((incident) => {
    const seed = QUEUE_SEED[incident.id]
    if (!seed) return incident
    return {
      ...incident,
      assignedTo: seed.assignedTo,
      activityLog: [
        ...incident.activityLog,
        {
          id: `act-${incident.id}-assign`,
          timestamp: incident.timestamp,
          type: 'assigned',
          actor: 'user-1',
          description: `Assigned to ${MOCK_FIELD_OPS_USERS[0].name}`,
        },
      ],
    }
  })
  activityCounter = 1000
}
