import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LeadershipView } from '../pages/LeadershipView'
import { exportLeadershipReport } from '../utils/report'
import { renderWithAuth } from '../test/testUtils'

// Charts are SVG-heavy; mock recharts and capture the data each chart receives.
const chartSpy = vi.hoisted(() => ({
  bar: { data: [] as Array<{ name: string; count: number }> },
  pie: { data: [] as Array<{ name: string; value: number }> },
  line: { data: [] as Array<{ date: string; count: number }> },
}))

vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    BarChart: ({ data }: { data: typeof chartSpy.bar.data }) => {
      chartSpy.bar.data = data ?? []
      return null
    },
    // The real chart passes data to <Pie>, not to <PieChart>, and PieChart
    // must render children so the mocked <Pie> actually mounts.
    PieChart: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    LineChart: ({ data }: { data: typeof chartSpy.line.data }) => {
      chartSpy.line.data = data ?? []
      return null
    },
    Bar: () => null,
    // The real chart passes data to <Pie>, not to <PieChart>.
    Pie: ({ data, children }: { data: typeof chartSpy.pie.data; children: React.ReactNode }) => {
      chartSpy.pie.data = data ?? []
      return <>{children}</>
    },
    Cell: () => null,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  }
})

vi.mock('../utils/report', () => ({
  exportLeadershipReport: vi.fn().mockResolvedValue(undefined),
}))

describe('LeadershipView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders KPI cards with the correct values', async () => {
    renderWithAuth(<LeadershipView />)
    // Loading first, then KPI values appear.
    expect(screen.getByLabelText('Loading dashboard')).toBeInTheDocument()
    expect(await screen.findByText('5')).toBeInTheDocument() // Total AOIs
    expect(screen.getByText('6')).toBeInTheDocument() // Active Incidents
    expect(screen.getByText('2.4h')).toBeInTheDocument() // Avg Response Time
    expect(screen.getByText('2 (25%)')).toBeInTheDocument() // Resolved
    expect(screen.getByText('Field Ops Active')).toBeInTheDocument()
    // Field Ops Active and Critical Incidents both have value 3.
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByTestId('kpi-total-aois')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-critical-incidents')).toBeInTheDocument()
    expect(screen.getByText('+12%')).toBeInTheDocument() // trend chip
  })

  it('renders charts with the correct data', async () => {
    renderWithAuth(<LeadershipView />)
    expect(await screen.findByTestId('incidents-by-type-chart')).toBeInTheDocument()
    expect(screen.getByTestId('severity-distribution-chart')).toBeInTheDocument()
    expect(screen.getByTestId('incident-trend-chart')).toBeInTheDocument()
    // Bar chart: 8 mock incidents across several types.
    expect(chartSpy.bar.data.length).toBeGreaterThan(0)
    expect(chartSpy.bar.data.reduce((sum, row) => sum + row.count, 0)).toBe(8)
    // Pie chart: severity slices (critical/warning/info).
    expect(chartSpy.pie.data).toHaveLength(3)
    // Trend: one point per day for the 30d range.
    expect(chartSpy.line.data).toHaveLength(30)
  })

  it('renders the activity feed', async () => {
    renderWithAuth(<LeadershipView />)
    expect(await screen.findByText('Recent Activity')).toBeInTheDocument()
    // Every incident's activity log has an 'Incident created' entry.
    expect(screen.getAllByText(/Incident created/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Field team completed patrol/)).toBeInTheDocument()
  })

  it('refetches when the date range changes', async () => {
    renderWithAuth(<LeadershipView />)
    await screen.findByText('Recent Activity')
    fireEvent.click(screen.getByRole('button', { name: '7 days' }))
    // The spinner is exposed via aria-label, not text.
    await waitFor(() => expect(screen.getByLabelText('Loading dashboard')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByLabelText('Loading dashboard')).not.toBeInTheDocument())
  })

  it('exports the report when Export Report is clicked', async () => {
    renderWithAuth(<LeadershipView />)
    await screen.findByText('Recent Activity')
    fireEvent.click(screen.getByTestId('export-report-button'))
    await waitFor(() => expect(exportLeadershipReport).toHaveBeenCalledTimes(1))
    const [data, range] = vi.mocked(exportLeadershipReport).mock.calls[0]
    expect(data.stats.totalAOIs).toBe(5)
    expect(range.preset).toBe('30d')
  })
})
