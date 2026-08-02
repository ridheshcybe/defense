import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { AOIDetailPanel } from '../components/aoi/AOIDetailPanel'
import { renderWithAnalyst, createAnalystValue } from '../test/testUtils'
import { MOCK_AOIS, MOCK_INCIDENTS, MOCK_ZONES } from '../data/mockData'
import { AnalystContext } from '../contexts/AnalystContext'
import { runAOPrediction } from '../api/aiApi'
import type { AIPrediction } from '../types'

vi.mock('../api/aiApi', () => ({
  runAOPrediction: vi.fn(),
}))

const mockedRunAOPrediction = vi.mocked(runAOPrediction)

describe('AOIDetailPanel', () => {
  it('renders nothing when no AOI is selected', () => {
    renderWithAnalyst(<AOIDetailPanel />)
    expect(screen.queryByText('Mumbai Central')).not.toBeInTheDocument()
  })

  it('shows the AOI name, tier, zones and fusion summary when selected', () => {
    renderWithAnalyst(<AOIDetailPanel />, {
      selectedAOI: MOCK_AOIS[0],
      incidents: MOCK_INCIDENTS,
      zones: MOCK_ZONES,
    })
    expect(screen.getByText('Mumbai Central')).toBeInTheDocument()
    expect(screen.getByText('Tier 1')).toBeInTheDocument()
    expect(screen.getByText(/Fusion summary: 3 incidents in this AOI/)).toBeInTheDocument()
    expect(screen.getByText('Target · 74')).toBeInTheDocument()
  })

  it('lists incidents in the AOI timeline (newest first)', () => {
    renderWithAnalyst(<AOIDetailPanel />, {
      selectedAOI: MOCK_AOIS[0],
      incidents: MOCK_INCIDENTS,
      zones: MOCK_ZONES,
    })
    expect(screen.getAllByText('Protest')).toHaveLength(2)
    expect(screen.getByText('Weapons')).toBeInTheDocument()
  })

  it('shows an empty alert when the AOI has no incidents', () => {
    // Exclude inc-8 (aoi-5) so Navi Mumbai has no incidents
    renderWithAnalyst(<AOIDetailPanel />, {
      selectedAOI: MOCK_AOIS[4],
      incidents: MOCK_INCIDENTS.slice(0, 7),
      zones: MOCK_ZONES,
    })
    expect(screen.getByText('No incidents in this AOI.')).toBeInTheDocument()
  })
})

describe('AOIDetailPanel AI analysis', () => {
  it('shows the Run AI analysis button for a selected AOI', () => {
    renderWithAnalyst(<AOIDetailPanel />, { selectedAOI: MOCK_AOIS[0] })
    expect(screen.getByRole('button', { name: /Run AI analysis/ })).toBeInTheDocument()
  })

  it('runs prediction on click and displays the result', async () => {
    mockedRunAOPrediction.mockResolvedValue({
      incident_type: 'intrusion',
      severity: 'warning',
      confidence: 0.87,
      confidence_interval: [0.6, 0.95],
      latency_ms: 210.5,
    })
    renderWithAnalyst(<AOIDetailPanel />, { selectedAOI: MOCK_AOIS[0] })
    fireEvent.click(screen.getByRole('button', { name: /Run AI analysis/ }))
    expect(mockedRunAOPrediction).toHaveBeenCalledWith('aoi-1')

    const result = await screen.findByText(/AI prediction: Intrusion/)
    expect(result).toBeInTheDocument()
    expect(screen.getByText('warning')).toBeInTheDocument()
    expect(screen.getByText('87% confidence')).toBeInTheDocument()
    expect(screen.getByText('211 ms')).toBeInTheDocument()
  })

  it('shows a loading state while the prediction is pending', async () => {
    let resolvePrediction: (value: AIPrediction) => void = () => undefined
    mockedRunAOPrediction.mockReturnValue(
      new Promise((resolve) => {
        resolvePrediction = resolve
      }),
    )
    renderWithAnalyst(<AOIDetailPanel />, { selectedAOI: MOCK_AOIS[0] })
    fireEvent.click(screen.getByRole('button', { name: /Run AI analysis/ }))
    expect(screen.getByText('Analyzing…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Analyzing/ })).toBeDisabled()

    resolvePrediction({
      incident_type: 'other',
      severity: 'info',
      confidence: 0.5,
    })
    await waitFor(() => expect(screen.getByText(/AI prediction: Other/)).toBeInTheDocument())
  })

  it('shows an error alert when the prediction fails', async () => {
    mockedRunAOPrediction.mockRejectedValue(
      new Error('Unable to connect to server. Check your connection.'),
    )
    renderWithAnalyst(<AOIDetailPanel />, { selectedAOI: MOCK_AOIS[0] })
    fireEvent.click(screen.getByRole('button', { name: /Run AI analysis/ }))
    // Assert the message directly: the panel may also render the "No incidents
    // in this AOI." info Alert, so role="alert" would match two elements.
    expect(
      await screen.findByText('Unable to connect to server. Check your connection.'),
    ).toBeInTheDocument()
  })

  it('clears a previous prediction when the selected AOI changes', async () => {
    mockedRunAOPrediction.mockResolvedValue({
      incident_type: 'intrusion',
      severity: 'warning',
      confidence: 0.87,
    })
    const view = renderWithAnalyst(<AOIDetailPanel />, {
      selectedAOI: MOCK_AOIS[0],
    })
    fireEvent.click(screen.getByRole('button', { name: /Run AI analysis/ }))
    await screen.findByText(/AI prediction: Intrusion/)

    view.rerender(
      <AnalystContext.Provider value={createAnalystValue({ selectedAOI: MOCK_AOIS[1] })}>
        <AOIDetailPanel />
      </AnalystContext.Provider>,
    )
    expect(screen.queryByText(/AI prediction: Intrusion/)).not.toBeInTheDocument()
  })
})
