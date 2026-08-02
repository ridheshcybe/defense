import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { FieldOpsUser, TransportAssignment, TransportStatus } from '../types'
import { MOCK_CREW_USERS } from '../data/mockData'
import {
  addNote as apiAddNote,
  completeRoute as apiCompleteRoute,
  fetchAssignments,
  startRoute as apiStartRoute,
} from '../api/crewTransportApi'
import type { Toast } from './AnalystContext'

export interface CrewTransportContextValue {
  assignments: TransportAssignment[]
  selectedAssignment: TransportAssignment | null
  currentUser: FieldOpsUser
  users: FieldOpsUser[]
  isLoading: boolean
  error: string | null
  toast: Toast | null
  selectAssignment: (assignment: TransportAssignment) => void
  updateStatus: (id: string, status: TransportStatus) => Promise<void>
  addNote: (id: string, note: string) => Promise<void>
  showToast: (message: string, severity?: Toast['severity']) => void
  hideToast: () => void
  refetch: () => void
}

export const CrewTransportContext = createContext<CrewTransportContextValue | null>(null)

// The demo crew operator. Swap for real session auth when the backend lands.
const CURRENT_USER_ID = 'crew-1'

interface CrewTransportProviderProps {
  children: ReactNode
  fetcher?: (userId: string) => Promise<TransportAssignment[]>
}

export function CrewTransportProvider({ children, fetcher }: CrewTransportProviderProps) {
  const users = MOCK_CREW_USERS
  const currentUser = users.find((user) => user.id === CURRENT_USER_ID) ?? (users[0] as FieldOpsUser)

  const loadAssignments = useCallback(() => {
    return fetcher ? fetcher(currentUser.id) : fetchAssignments(currentUser.id)
  }, [fetcher, currentUser.id])

  const [assignmentState, setAssignments] = useState<TransportAssignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<TransportAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  // Mirrors useFieldOpsData: a stable `load` callback drives both the initial
  // fetch and manual refetch, so refetch needs no reload-key state.
  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await loadAssignments()
      setAssignments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setIsLoading(false)
    }
  }, [loadAssignments])

  useEffect(() => {
    void load()
  }, [load])

  const selectAssignment = useCallback((assignment: TransportAssignment) => {
    setSelectedAssignment(assignment)
  }, [])

  const showToast = useCallback((message: string, severity: Toast['severity'] = 'success') => {
    setToast({ message, severity })
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  const refetch = useCallback(() => {
    void load()
  }, [load])

  const updateStatus = useCallback(
    async (id: string, status: TransportStatus) => {
      try {
        let updated: TransportAssignment
        if (status === 'in-progress') {
          updated = await apiStartRoute(id)
        } else if (status === 'completed') {
          updated = await apiCompleteRoute(id)
        } else {
          throw new Error(`Unsupported route transition: ${status}`)
        }
        setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)))
        showToast(`Route ${status === 'in-progress' ? 'started' : 'marked complete'}`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update route', 'error')
      }
    },
    [showToast],
  )

  const addNote = useCallback(
    async (id: string, note: string) => {
      try {
        const updated = await apiAddNote(id, note)
        setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)))
        showToast('Note added')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to add note', 'error')
      }
    },
    [showToast],
  )

  const value = useMemo<CrewTransportContextValue>(
    () => ({
      assignments: assignmentState,
      selectedAssignment,
      currentUser,
      users,
      isLoading,
      error,
      toast,
      selectAssignment,
      updateStatus,
      addNote,
      showToast,
      hideToast,
      refetch,
    }),
    [
      assignmentState,
      selectedAssignment,
      currentUser,
      isLoading,
      error,
      toast,
      selectAssignment,
      updateStatus,
      addNote,
      showToast,
      hideToast,
      refetch,
    ],
  )

  return <CrewTransportContext.Provider value={value}>{children}</CrewTransportContext.Provider>
}

export function useCrewTransport() {
  const ctx = useContext(CrewTransportContext)
  if (!ctx) {
    throw new Error('useCrewTransport must be used within a CrewTransportProvider')
  }
  return ctx
}
