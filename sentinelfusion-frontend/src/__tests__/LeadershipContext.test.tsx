import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LeadershipProvider, useLeadership } from '../contexts/LeadershipContext'
import type { DateRange, LeadershipData } from '../types'

const fakeData: LeadershipData = {
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
  incidentsByType: [{ type: 'threat', count: 2 }],
  severityDistribution: [{ severity: 'critical', count: 3 }],
  incidentTrend: [{ date: '2026-08-01', count: 4 }],
  activities: [
    {
      id: 'act-1',
      timestamp: '2026-08-01 14:30',
      type: 'incident_created',
      description: 'Incident created',
      user: 'System',
    },
  ],
}

function Probe() {
  const { stats, activities, dateRange, isLoading, error, fetchLeadershipData, refetch } =
    useLeadership()
  return (
    <div>
      <span data-testid="aois">{stats.totalAOIs}</span>
      <span data-testid="range">{`${dateRange.preset}:${dateRange.from}:${dateRange.to}`}</span>
      <span data-testid="activities">{activities.length}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{error ?? 'none'}</span>
      <button type="button" onClick={() => fetchLeadershipData({ preset: '7d', from: '2026-07-25', to: '2026-08-01' })}>
        set 7d
      </button>
      <button type="button" onClick={refetch}>
        refetch
      </button>
    </div>
  )
}

describe('LeadershipContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads leadership data through the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeData)
    render(
      <LeadershipProvider fetcher={fetcher}>
        <Probe />
      </LeadershipProvider>,
    )
    expect(screen.getByTestId('loading').textContent).toBe('true')
    await waitFor(() => expect(screen.getByTestId('aois').textContent).toBe('5'))
    expect(screen.getByTestId('activities').textContent).toBe('1')
    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('error').textContent).toBe('none')
  })

  it('refetches when the date range changes', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeData)
    render(
      <LeadershipProvider fetcher={fetcher}>
        <Probe />
      </LeadershipProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('aois').textContent).toBe('5'))
    expect(fetcher).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('set 7d'))
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    expect(fetcher.mock.calls[1][0]).toMatchObject<DateRange>({ preset: '7d' })
    expect(screen.getByTestId('range').textContent).toContain('7d:2026-07-25:2026-08-01')
  })

  it('surfaces the fetcher error', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Backend unreachable'))
    render(
      <LeadershipProvider fetcher={fetcher}>
        <Probe />
      </LeadershipProvider>,
    )
    await waitFor(() =>
      expect(screen.getByTestId('error').textContent).toBe('Backend unreachable'),
    )
  })

  it('refetches on demand', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeData)
    render(
      <LeadershipProvider fetcher={fetcher}>
        <Probe />
      </LeadershipProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('aois').textContent).toBe('5'))
    fireEvent.click(screen.getByText('refetch'))
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  })
})
