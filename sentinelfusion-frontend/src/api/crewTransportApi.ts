import { MOCK_CREW_USERS, MOCK_TRANSPORT_ASSIGNMENTS } from '../data/mockData'
import type { TransportAssignment } from '../types'

const SIMULATED_DELAY_MS = 300

// The demo crew operator. Swap for real session auth when the backend lands.
const CREW_USER_ID = 'crew-1'

let assignmentStore: TransportAssignment[] = MOCK_TRANSPORT_ASSIGNMENTS.map((assignment) =>
  // Seed a note actor so route cards feel alive in the demo.
  assignment.notes.length > 0 && assignment.assignedTo === CREW_USER_ID
    ? {
        ...assignment,
        notes: [`${assignment.notes[0]} (${MOCK_CREW_USERS[0].name})`],
      }
    : assignment,
)

async function simulate<T>(producer: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))
  return producer()
}

/** The crew queue: routes assigned to the user plus unassigned, incomplete ones. */
export async function fetchAssignments(userId: string): Promise<TransportAssignment[]> {
  return simulate(() =>
    assignmentStore.filter(
      (assignment) =>
        assignment.assignedTo === userId ||
        (assignment.assignedTo === null && assignment.status !== 'completed'),
    ),
  )
}

function patchAssignment(id: string, patch: Partial<TransportAssignment>): TransportAssignment {
  const index = assignmentStore.findIndex((assignment) => assignment.id === id)
  if (index === -1) throw new Error('Assignment not found')
  const updated = { ...assignmentStore[index], ...patch, updatedAt: 'just now' }
  assignmentStore = assignmentStore.map((assignment) => (assignment.id === id ? updated : assignment))
  return updated
}

export async function startRoute(id: string): Promise<TransportAssignment> {
  return simulate(() => patchAssignment(id, { status: 'in-progress' }))
}

export async function completeRoute(id: string): Promise<TransportAssignment> {
  return simulate(() => patchAssignment(id, { status: 'completed', etaMinutes: 0 }))
}

export async function addNote(id: string, note: string): Promise<TransportAssignment> {
  return simulate(() => {
    const current = assignmentStore.find((assignment) => assignment.id === id)
    if (!current) throw new Error('Assignment not found')
    return patchAssignment(id, {
      notes: [...current.notes, `${note} (${MOCK_CREW_USERS[0].name})`],
    })
  })
}

/** Test helper: resets the in-memory store to the seeded mock. */
export function resetCrewStore(): void {
  assignmentStore = MOCK_TRANSPORT_ASSIGNMENTS
}
