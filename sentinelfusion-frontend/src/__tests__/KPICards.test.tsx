import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KPICards } from '../components/leadership/KPICards'
import type { LeadershipStats } from '../types'

const stats: LeadershipStats = {
  totalAOIs: 5,
  activeIncidents: 6,
  activeIncidentsTrend: -4,
  avgResponseHours: 2.4,
  resolvedIncidents: 2,
  resolutionRate: 25,
  fieldOpsActive: 3,
  criticalIncidents: 3,
}

describe('KPICards', () => {
  it('renders all six KPI cards with values and labels', () => {
    render(<KPICards stats={stats} />)
    expect(screen.getByText('Total AOIs')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Active Incidents')).toBeInTheDocument()
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
    expect(screen.getByText('2.4h')).toBeInTheDocument()
    expect(screen.getByText('Incidents Resolved')).toBeInTheDocument()
    expect(screen.getByText('2 (25%)')).toBeInTheDocument()
    expect(screen.getByText('Field Ops Active')).toBeInTheDocument()
    expect(screen.getByText('Critical Incidents')).toBeInTheDocument()
  })

  it('shows a negative trend chip for declining active incidents', () => {
    render(<KPICards stats={stats} />)
    expect(screen.getByText('-4%')).toBeInTheDocument()
  })

  it('renders the highlighted critical incidents card', () => {
    render(<KPICards stats={stats} />)
    // The critical card is present and shows the value with a warning icon.
    const card = screen.getByTestId('kpi-critical-incidents')
    expect(card).toHaveTextContent('3')
    expect(card).toHaveTextContent('Critical Incidents')
  })
})
