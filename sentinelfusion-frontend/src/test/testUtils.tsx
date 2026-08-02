import { render } from '@testing-library/react'
import { vi } from 'vitest'
import type { ReactElement } from 'react'
import type { AnalystContextValue } from '../contexts/AnalystContext'
import { AnalystContext } from '../contexts/AnalystContext'
import type { FieldOpsContextValue } from '../contexts/FieldOpsContext'
import { FieldOpsContext } from '../contexts/FieldOpsContext'
import type { LeadershipContextValue } from '../contexts/LeadershipContext'
import { LeadershipContext } from '../contexts/LeadershipContext'
import type { AuthContextValue } from '../contexts/AuthContext'
import { AuthContext } from '../contexts/AuthContext'
import type { CrewTransportContextValue } from '../contexts/CrewTransportContext'
import { CrewTransportContext } from '../contexts/CrewTransportContext'
import { MOCK_CREW_USERS, MOCK_FIELD_OPS_USERS } from '../data/mockData'
import type { FieldOpsUser, User } from '../types'

export const TEST_USER_ANALYST: User = {
  id: 'u-analyst',
  email: 'analyst@fusion.dev',
  name: 'Aria Singh',
  role: 'analyst',
}

export const TEST_USER_FIELD_OPS: User = {
  id: 'u-ops',
  email: 'ops@fusion.dev',
  name: 'Dev Patel',
  role: 'field_ops',
}

export const TEST_USER_LEADERSHIP: User = {
  id: 'u-exec',
  email: 'exec@fusion.dev',
  name: 'Rhea Menon',
  role: 'leadership',
}

export function createAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  const base: AuthContextValue = {
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn().mockResolvedValue(TEST_USER_ANALYST),
    logout: vi.fn(),
    refreshToken: vi.fn().mockResolvedValue(undefined),
    checkAuth: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  return base
}

export function renderWithAuth(
  ui: ReactElement,
  value: Partial<AuthContextValue> = {},
) {
  return render(<AuthContext.Provider value={createAuthValue(value)}>{ui}</AuthContext.Provider>)
}

export function createAnalystValue(
  overrides: Partial<AnalystContextValue> = {},
): AnalystContextValue {
  const aois = overrides.aois ?? []
  const incidents = overrides.incidents ?? []
  const base: AnalystContextValue = {
    selectedAOI: null,
    selectedIncident: null,
    aois,
    incidents,
    zones: [],
    entities: [],
    groups: [],
    users: [],
    isLoading: false,
    error: null,
    query: '',
    toast: null,
    selectAOI: vi.fn(),
    selectIncident: vi.fn(),
    filterAOIs: (query: string) => {
      const q = query.trim().toLowerCase()
      return q ? aois.filter((aoi) => aoi.name.toLowerCase().includes(q)) : aois
    },
    filterIncidents: (aoiId: string) =>
      incidents.filter((incident) => incident.aoiId === aoiId),
    runQuery: () => [],
    setQuery: vi.fn(),
    setTriage: vi.fn(),
    createAOI: vi.fn().mockResolvedValue(undefined),
    updateAOI: vi.fn().mockResolvedValue(undefined),
    deleteAOI: vi.fn().mockResolvedValue(undefined),
    createIncident: vi.fn().mockResolvedValue(undefined),
    updateIncident: vi.fn().mockResolvedValue(undefined),
    updateIncidentStatus: vi.fn().mockResolvedValue(undefined),
    assignIncident: vi.fn().mockResolvedValue(undefined),
    deleteIncident: vi.fn().mockResolvedValue(undefined),
    showToast: vi.fn(),
    hideToast: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  }
  return base
}

export function renderWithAnalyst(
  ui: ReactElement,
  value: Partial<AnalystContextValue> = {},
) {
  return render(<AnalystContext.Provider value={createAnalystValue(value)}>{ui}</AnalystContext.Provider>)
}

export function createFieldOpsValue(
  overrides: Partial<FieldOpsContextValue> = {},
): FieldOpsContextValue {
  const incidents = overrides.incidents ?? []
  const users = overrides.users ?? MOCK_FIELD_OPS_USERS
  const currentUser: FieldOpsUser = overrides.currentUser ?? MOCK_FIELD_OPS_USERS[0]
  const base: FieldOpsContextValue = {
    incidents,
    selectedIncident: null,
    currentUser,
    users,
    isLoading: false,
    error: null,
    toast: null,
    selectIncident: vi.fn(),
    updateIncidentStatus: vi.fn().mockResolvedValue(undefined),
    addNote: vi.fn().mockResolvedValue(undefined),
    showToast: vi.fn(),
    hideToast: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  }
  return base
}

export function renderWithFieldOps(
  ui: ReactElement,
  value: Partial<FieldOpsContextValue> = {},
) {
  return render(<FieldOpsContext.Provider value={createFieldOpsValue(value)}>{ui}</FieldOpsContext.Provider>)
}

export function createLeadershipValue(
  overrides: Partial<LeadershipContextValue> = {},
): LeadershipContextValue {
  const base: LeadershipContextValue = {
    stats: {
      totalAOIs: 5,
      activeIncidents: 6,
      activeIncidentsTrend: 12,
      avgResponseHours: 2.4,
      resolvedIncidents: 2,
      resolutionRate: 25,
      fieldOpsActive: 3,
      criticalIncidents: 3,
    },
    incidentsByType: [],
    severityDistribution: [],
    incidentTrend: [],
    activities: [],
    dateRange: { preset: '30d', from: '2026-07-02', to: '2026-08-01' },
    isLoading: false,
    error: null,
    toast: null,
    fetchLeadershipData: vi.fn().mockResolvedValue(undefined),
    showToast: vi.fn(),
    hideToast: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  }
  return base
}

export function renderWithLeadership(
  ui: ReactElement,
  value: Partial<LeadershipContextValue> = {},
) {
  return render(
    <LeadershipContext.Provider value={createLeadershipValue(value)}>{ui}</LeadershipContext.Provider>,
  )
}

export function createCrewTransportValue(
  overrides: Partial<CrewTransportContextValue> = {},
): CrewTransportContextValue {
  const assignments = overrides.assignments ?? []
  const users = overrides.users ?? MOCK_CREW_USERS
  const currentUser: FieldOpsUser = overrides.currentUser ?? MOCK_CREW_USERS[0]
  const base: CrewTransportContextValue = {
    assignments,
    selectedAssignment: null,
    currentUser,
    users,
    isLoading: false,
    error: null,
    toast: null,
    selectAssignment: vi.fn(),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    addNote: vi.fn().mockResolvedValue(undefined),
    showToast: vi.fn(),
    hideToast: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  }
  return base
}

export function renderWithCrewTransport(
  ui: ReactElement,
  value: Partial<CrewTransportContextValue> = {},
) {
  return render(
    <CrewTransportContext.Provider value={createCrewTransportValue(value)}>
      {ui}
    </CrewTransportContext.Provider>,
  )
}
