import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  Activity,
  DateRange,
  IncidentTypeCount,
  LeadershipData,
  LeadershipStats,
  SeveritySlice,
  TrendPoint,
} from '../types'
import { useLeadershipData } from '../hooks/useLeadershipData'
import type { Toast } from './AnalystContext'

export const DEFAULT_DATE_RANGE: DateRange = {
  preset: '30d',
  from: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
  to: new Date().toISOString().slice(0, 10),
}

export interface LeadershipContextValue {
  stats: LeadershipStats
  incidentsByType: IncidentTypeCount[]
  severityDistribution: SeveritySlice[]
  incidentTrend: TrendPoint[]
  activities: Activity[]
  dateRange: DateRange
  isLoading: boolean
  error: string | null
  toast: Toast | null
  fetchLeadershipData: (range: DateRange) => Promise<void>
  showToast: (message: string, severity?: Toast['severity']) => void
  hideToast: () => void
  refetch: () => void
}

export const LeadershipContext = createContext<LeadershipContextValue | null>(null)

interface LeadershipProviderProps {
  children: ReactNode
  fetcher?: (range: DateRange) => Promise<LeadershipData>
}

const EMPTY_DATA: LeadershipData = {
  stats: {
    totalAOIs: 0,
    activeIncidents: 0,
    activeIncidentsTrend: 0,
    avgResponseHours: 0,
    resolvedIncidents: 0,
    resolutionRate: 0,
    fieldOpsActive: 0,
    criticalIncidents: 0,
  },
  incidentsByType: [],
  severityDistribution: [],
  incidentTrend: [],
  activities: [],
}

export function LeadershipProvider({ children, fetcher }: LeadershipProviderProps) {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE)
  const [data, setData] = useState<LeadershipData | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const { data: fetched, isLoading, error, refetch } = useLeadershipData(dateRange, fetcher)

  useEffect(() => {
    if (fetched) setData(fetched)
  }, [fetched])

  const fetchLeadershipData = useCallback(async (range: DateRange) => {
    setDateRange(range)
  }, [])

  const showToast = useCallback((message: string, severity: Toast['severity'] = 'success') => {
    setToast({ message, severity })
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  const value = useMemo<LeadershipContextValue>(
    () => ({
      stats: data?.stats ?? EMPTY_DATA.stats,
      incidentsByType: data?.incidentsByType ?? EMPTY_DATA.incidentsByType,
      severityDistribution: data?.severityDistribution ?? EMPTY_DATA.severityDistribution,
      incidentTrend: data?.incidentTrend ?? EMPTY_DATA.incidentTrend,
      activities: data?.activities ?? EMPTY_DATA.activities,
      dateRange,
      isLoading,
      error,
      toast,
      fetchLeadershipData,
      showToast,
      hideToast,
      refetch,
    }),
    [
      data,
      dateRange,
      isLoading,
      error,
      toast,
      fetchLeadershipData,
      showToast,
      hideToast,
      refetch,
    ],
  )

  return <LeadershipContext.Provider value={value}>{children}</LeadershipContext.Provider>
}

export function useLeadership() {
  const ctx = useContext(LeadershipContext)
  if (!ctx) {
    throw new Error('useLeadership must be used within a LeadershipProvider')
  }
  return ctx
}
