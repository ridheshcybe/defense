import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { FieldOpsUser, Incident, IncidentStatus } from '../types'
import { MOCK_FIELD_OPS_USERS } from '../data/mockData'
import { addNote as apiAddNote, updateIncidentStatus as apiUpdateIncidentStatus } from '../api/fieldOpsApi'
import { useFieldOpsData } from '../hooks/useFieldOpsData'
import type { Toast } from './AnalystContext'

export interface FieldOpsContextValue {
  incidents: Incident[]
  selectedIncident: Incident | null
  currentUser: FieldOpsUser
  users: FieldOpsUser[]
  isLoading: boolean
  error: string | null
  toast: Toast | null
  selectIncident: (incident: Incident) => void
  updateIncidentStatus: (id: string, status: IncidentStatus) => Promise<void>
  addNote: (id: string, note: string) => Promise<void>
  showToast: (message: string, severity?: Toast['severity']) => void
  hideToast: () => void
  refetch: () => void
}

export const FieldOpsContext = createContext<FieldOpsContextValue | null>(null)

// The demo operator. Swap for real session auth when the backend lands.
const CURRENT_USER_ID = 'user-1'

interface FieldOpsProviderProps {
  children: ReactNode
  fetcher?: (userId: string) => Promise<Incident[]>
}

export function FieldOpsProvider({ children, fetcher }: FieldOpsProviderProps) {
  const users = MOCK_FIELD_OPS_USERS
  const currentUser =
    users.find((user) => user.id === CURRENT_USER_ID) ?? (users[0] as FieldOpsUser)

  const { data, isLoading, error, refetch } = useFieldOpsData(currentUser.id, fetcher)
  const [incidentState, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    if (data) setIncidents(data)
  }, [data])

  const selectIncident = useCallback((incident: Incident) => {
    setSelectedIncident(incident)
  }, [])

  const showToast = useCallback((message: string, severity: Toast['severity'] = 'success') => {
    setToast({ message, severity })
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  const updateIncidentStatus = useCallback(
    async (id: string, status: IncidentStatus) => {
      try {
        const updated = await apiUpdateIncidentStatus(id, status)
        setIncidents((prev) => prev.map((incident) => (incident.id === id ? updated : incident)))
        showToast('Incident status updated')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update status', 'error')
      }
    },
    [showToast],
  )

  const addNote = useCallback(
    async (id: string, note: string) => {
      try {
        const updated = await apiAddNote(id, note)
        setIncidents((prev) => prev.map((incident) => (incident.id === id ? updated : incident)))
        showToast('Note added')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add note', 'error')
      }
    },
    [showToast],
  )

  const value = useMemo<FieldOpsContextValue>(
    () => ({
      incidents: incidentState,
      selectedIncident,
      currentUser,
      users,
      isLoading,
      error,
      toast,
      selectIncident,
      updateIncidentStatus,
      addNote,
      showToast,
      hideToast,
      refetch,
    }),
    [
      incidentState,
      selectedIncident,
      currentUser,
      isLoading,
      error,
      toast,
      selectIncident,
      updateIncidentStatus,
      addNote,
      showToast,
      hideToast,
      refetch,
    ],
  )

  return <FieldOpsContext.Provider value={value}>{children}</FieldOpsContext.Provider>
}

export function useFieldOps() {
  const ctx = useContext(FieldOpsContext)
  if (!ctx) {
    throw new Error('useFieldOps must be used within a FieldOpsProvider')
  }
  return ctx
}
