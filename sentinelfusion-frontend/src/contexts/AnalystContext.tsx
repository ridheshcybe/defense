import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AOI,
  CreateAOIDTO,
  CreateIncidentDTO,
  Entity,
  FieldOpsUser,
  Group,
  Incident,
  IncidentStatus,
  TriageLabel,
  UpdateAOIDTO,
  UpdateIncidentDTO,
  Zone,
} from '../types'
import { useAOIData } from '../hooks/useAOIData'
import { useIncidentData } from '../hooks/useIncidentData'
import { MOCK_ENTITIES, MOCK_FIELD_OPS_USERS, MOCK_GROUPS, MOCK_ZONES } from '../data/mockData'
import {
  createAOI as apiCreateAOI,
  updateAOI as apiUpdateAOI,
  deleteAOI as apiDeleteAOI,
} from '../api/aoiApi'
import {
  createIncident as apiCreateIncident,
  updateIncident as apiUpdateIncident,
  updateIncidentStatus as apiUpdateIncidentStatus,
  assignIncident as apiAssignIncident,
  deleteIncident as apiDeleteIncident,
} from '../api/incidentApi'
import { removeCached } from '../api/cache'

export interface Toast {
  message: string
  severity: 'success' | 'error'
}

export interface AnalystContextValue {
  selectedAOI: AOI | null
  selectedIncident: Incident | null
  aois: AOI[]
  incidents: Incident[]
  zones: Zone[]
  entities: Entity[]
  groups: Group[]
  users: FieldOpsUser[]
  isLoading: boolean
  error: string | null
  query: string
  toast: Toast | null
  selectAOI: (aoi: AOI) => void
  selectIncident: (incident: Incident) => void
  filterAOIs: (query: string) => AOI[]
  filterIncidents: (aoiId: string) => Incident[]
  runQuery: (query: string) => Incident[]
  setQuery: (query: string) => void
  setTriage: (incidentId: string, label: TriageLabel) => void
  createAOI: (data: CreateAOIDTO) => Promise<void>
  updateAOI: (id: string, data: UpdateAOIDTO) => Promise<void>
  deleteAOI: (id: string) => Promise<void>
  createIncident: (data: CreateIncidentDTO) => Promise<void>
  updateIncident: (id: string, data: UpdateIncidentDTO) => Promise<void>
  updateIncidentStatus: (id: string, status: IncidentStatus) => Promise<void>
  assignIncident: (id: string, userId: string | null) => Promise<void>
  deleteIncident: (id: string) => Promise<void>
  showToast: (message: string, severity?: Toast['severity']) => void
  hideToast: () => void
  refetch: () => void
}

export const AnalystContext = createContext<AnalystContextValue | null>(null)

interface AnalystProviderProps {
  children: ReactNode
  aoiFetcher?: () => Promise<AOI[]>
  incidentFetcher?: (aoiId: string | null) => Promise<Incident[]>
}

export function AnalystProvider({
  children,
  aoiFetcher,
  incidentFetcher,
}: AnalystProviderProps) {
  const {
    data: aoiData,
    isLoading: aoisLoading,
    error: aoisError,
    refetch: refetchAOIs,
  } = useAOIData(aoiFetcher)
  const [selectedAOI, setSelectedAOI] = useState<AOI | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [query, setQuery] = useState('')
  const [triageOverrides, setTriageOverrides] = useState<Record<string, TriageLabel>>({})
  const [aois, setAois] = useState<AOI[]>([])
  const [incidentState, setIncidents] = useState<Incident[]>([])
  const [toast, setToast] = useState<Toast | null>(null)

  // Keep the local AOI list in sync with fetched data so CRUD updates render immediately.
  useEffect(() => {
    if (aoiData) setAois(aoiData)
  }, [aoiData])

  const {
    data: incidentData,
    isLoading: incidentsLoading,
    error: incidentsError,
    refetch: refetchIncidents,
  } = useIncidentData(selectedAOI?.id ?? null, incidentFetcher)

  // Local incidents list mirrors the fetched (per-AOI) data; CRUD mutations update it directly.
  useEffect(() => {
    if (incidentData) setIncidents(incidentData)
  }, [incidentData])

  // Zones/entities/groups/users are static mock references for now; swap for fetched data when the API lands.
  const zones = MOCK_ZONES
  const entities = MOCK_ENTITIES
  const groups = MOCK_GROUPS
  const users = MOCK_FIELD_OPS_USERS
  const incidents = useMemo(
    () =>
      incidentState.map((incident) =>
        triageOverrides[incident.id]
          ? { ...incident, triageLabel: triageOverrides[incident.id] }
          : incident,
      ),
    [incidentState, triageOverrides],
  )
  const isLoading = aoisLoading || incidentsLoading
  const error = aoisError ?? incidentsError

  const selectAOI = useCallback((aoi: AOI) => {
    setSelectedAOI(aoi)
    setSelectedIncident(null)
  }, [])

  const selectIncident = useCallback((incident: Incident) => {
    setSelectedIncident(incident)
  }, [])

  const filterAOIs = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) return aois
      return aois.filter((aoi) => aoi.name.toLowerCase().includes(q))
    },
    [aois],
  )

  const filterIncidents = useCallback(
    (aoiId: string) => incidents.filter((incident) => incident.aoiId === aoiId),
    [incidents],
  )

  /** Mock natural-language query: matches every term against type, description, triage, groups, AOI name. */
  const runQuery = useCallback(
    (q: string) => {
      const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
      if (terms.length === 0) return []
      return incidents.filter((incident) => {
        const aoi = aois.find((a) => a.id === incident.aoiId)
        const haystack = [
          incident.type.replace(/_/g, ' '),
          incident.description,
          incident.triageLabel,
          ...incident.groupTags,
          aoi?.name ?? '',
        ]
          .join(' ')
          .toLowerCase()
        return terms.every((term) => haystack.includes(term))
      })
    },
    [incidents, aois],
  )

  const setTriage = useCallback((incidentId: string, label: TriageLabel) => {
    setTriageOverrides((prev) => ({ ...prev, [incidentId]: label }))
  }, [])

  const showToast = useCallback((message: string, severity: Toast['severity'] = 'success') => {
    setToast({ message, severity })
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  const removeIncidentCaches = useCallback((aoiId: string) => {
    removeCached(`incidents:${aoiId}`)
    removeCached('incidents:all')
  }, [])

  const createAOI = useCallback(
    async (data: CreateAOIDTO) => {
      try {
        const created = await apiCreateAOI(data)
        setAois((prev) => [created, ...prev])
        removeCached('aois')
        showToast(`AOI "${created.name}" created`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to create AOI', 'error')
      }
    },
    [showToast],
  )

  const updateAOI = useCallback(
    async (id: string, data: UpdateAOIDTO) => {
      try {
        const updated = await apiUpdateAOI(id, data)
        setAois((prev) => prev.map((aoi) => (aoi.id === id ? updated : aoi)))
        removeCached('aois')
        showToast(`AOI "${updated.name}" updated`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update AOI', 'error')
      }
    },
    [showToast],
  )

  const deleteAOI = useCallback(
    async (id: string) => {
      try {
        const target = aois.find((aoi) => aoi.id === id)
        await apiDeleteAOI(id)
        setAois((prev) => prev.filter((aoi) => aoi.id !== id))
        if (selectedAOI?.id === id) setSelectedAOI(null)
        removeCached('aois')
        showToast(target ? `AOI "${target.name}" deleted` : 'AOI deleted')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to delete AOI', 'error')
      }
    },
    [aois, selectedAOI, showToast],
  )

  const createIncident = useCallback(
    async (data: CreateIncidentDTO) => {
      try {
        const created = await apiCreateIncident(data)
        setIncidents((prev) => [created, ...prev])
        removeIncidentCaches(data.aoiId)
        showToast('Incident created')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to create incident', 'error')
      }
    },
    [removeIncidentCaches, showToast],
  )

  const updateIncident = useCallback(
    async (id: string, data: UpdateIncidentDTO) => {
      try {
        const updated = await apiUpdateIncident(id, data)
        setIncidents((prev) => prev.map((incident) => (incident.id === id ? updated : incident)))
        removeIncidentCaches(updated.aoiId)
        showToast('Incident updated')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update incident', 'error')
      }
    },
    [removeIncidentCaches, showToast],
  )

  const updateIncidentStatus = useCallback(
    async (id: string, status: IncidentStatus) => {
      try {
        const updated = await apiUpdateIncidentStatus(id, status)
        setIncidents((prev) => prev.map((incident) => (incident.id === id ? updated : incident)))
        removeIncidentCaches(updated.aoiId)
        showToast('Incident status updated')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update status', 'error')
      }
    },
    [removeIncidentCaches, showToast],
  )

  const assignIncident = useCallback(
    async (id: string, userId: string | null) => {
      try {
        const updated = await apiAssignIncident(id, userId)
        setIncidents((prev) => prev.map((incident) => (incident.id === id ? updated : incident)))
        removeIncidentCaches(updated.aoiId)
        showToast(userId ? 'Incident assigned' : 'Incident unassigned')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to assign incident', 'error')
      }
    },
    [removeIncidentCaches, showToast],
  )

  const deleteIncident = useCallback(
    async (id: string) => {
      try {
        const target = incidents.find((incident) => incident.id === id)
        await apiDeleteIncident(id)
        setIncidents((prev) => prev.filter((incident) => incident.id !== id))
        if (selectedIncident?.id === id) setSelectedIncident(null)
        if (target) removeIncidentCaches(target.aoiId)
        showToast('Incident deleted')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to delete incident', 'error')
      }
    },
    [incidents, selectedIncident, removeIncidentCaches, showToast],
  )

  const refetch = useCallback(() => {
    refetchAOIs()
    refetchIncidents()
  }, [refetchAOIs, refetchIncidents])

  const value = useMemo<AnalystContextValue>(
    () => ({
      selectedAOI,
      selectedIncident,
      aois,
      incidents,
      zones,
      entities,
      groups,
      users,
      isLoading,
      error,
      query,
      toast,
      selectAOI,
      selectIncident,
      filterAOIs,
      filterIncidents,
      runQuery,
      setQuery,
      setTriage,
      createAOI,
      updateAOI,
      deleteAOI,
      createIncident,
      updateIncident,
      updateIncidentStatus,
      assignIncident,
      deleteIncident,
      showToast,
      hideToast,
      refetch,
    }),
    [
      selectedAOI,
      selectedIncident,
      aois,
      incidents,
      isLoading,
      error,
      query,
      toast,
      selectAOI,
      selectIncident,
      filterAOIs,
      filterIncidents,
      runQuery,
      setTriage,
      createAOI,
      updateAOI,
      deleteAOI,
      createIncident,
      updateIncident,
      updateIncidentStatus,
      assignIncident,
      deleteIncident,
      showToast,
      hideToast,
      refetch,
    ],
  )

  return <AnalystContext.Provider value={value}>{children}</AnalystContext.Provider>
}

export function useAnalyst() {
  const ctx = useContext(AnalystContext)
  if (!ctx) {
    throw new Error('useAnalyst must be used within an AnalystProvider')
  }
  return ctx
}
