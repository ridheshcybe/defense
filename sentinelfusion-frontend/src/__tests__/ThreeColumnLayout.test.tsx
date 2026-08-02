import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { ThreeColumnLayout } from '../components/layout/ThreeColumnLayout'
import { renderWithAnalyst } from '../test/testUtils'
import { MOCK_AOIS, MOCK_INCIDENTS } from '../data/mockData'

describe('ThreeColumnLayout', () => {
  it('renders children and both sidebar headers', () => {
    renderWithAnalyst(
      <ThreeColumnLayout leftOpen rightOpen onToggleLeft={vi.fn()} onToggleRight={vi.fn()}>
        <div>map content</div>
      </ThreeColumnLayout>,
      { aois: MOCK_AOIS, incidents: MOCK_INCIDENTS },
    )
    expect(screen.getByText('map content')).toBeInTheDocument()
    expect(screen.getByText('Areas of Interest')).toBeInTheDocument()
    expect(screen.getByText('Incidents')).toBeInTheDocument()
  })

  it('calls onToggleLeft when the left collapse button is clicked', () => {
    const onToggleLeft = vi.fn()
    renderWithAnalyst(
      <ThreeColumnLayout leftOpen rightOpen onToggleLeft={onToggleLeft} onToggleRight={vi.fn()}>
        <div>map content</div>
      </ThreeColumnLayout>,
      { aois: MOCK_AOIS, incidents: MOCK_INCIDENTS },
    )
    fireEvent.click(screen.getByLabelText('Collapse AOI panel'))
    expect(onToggleLeft).toHaveBeenCalledTimes(1)
  })

  it('calls onToggleRight when the right collapse button is clicked', () => {
    const onToggleRight = vi.fn()
    renderWithAnalyst(
      <ThreeColumnLayout leftOpen rightOpen onToggleLeft={vi.fn()} onToggleRight={onToggleRight}>
        <div>map content</div>
      </ThreeColumnLayout>,
      { aois: MOCK_AOIS, incidents: MOCK_INCIDENTS },
    )
    fireEvent.click(screen.getByLabelText('Collapse incident panel'))
    expect(onToggleRight).toHaveBeenCalledTimes(1)
  })

  it('shows expand buttons when a drawer is collapsed', () => {
    renderWithAnalyst(
      <ThreeColumnLayout
        leftOpen={false}
        rightOpen={false}
        onToggleLeft={vi.fn()}
        onToggleRight={vi.fn()}
      >
        <div>map content</div>
      </ThreeColumnLayout>,
      { aois: MOCK_AOIS, incidents: MOCK_INCIDENTS },
    )
    expect(screen.getByLabelText('Expand AOI panel')).toBeInTheDocument()
    expect(screen.getByLabelText('Expand incident panel')).toBeInTheDocument()
  })
})
