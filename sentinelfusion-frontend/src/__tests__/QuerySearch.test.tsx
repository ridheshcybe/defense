import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { QuerySearch } from '../components/search/QuerySearch'
import { AnalystContext } from '../contexts/AnalystContext'
import { createAnalystValue } from '../test/testUtils'
import { render } from '@testing-library/react'
import { MOCK_INCIDENTS } from '../data/mockData'

function Harness({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const value = createAnalystValue({
    query,
    setQuery,
    selectIncident: (incident) => onSelect(incident.id),
    runQuery: (q: string) =>
      q ? MOCK_INCIDENTS.filter((incident) => incident.type.includes(q.toLowerCase())) : [],
  })
  return (
    <AnalystContext.Provider value={value}>
      <QuerySearch />
    </AnalystContext.Provider>
  )
}

describe('QuerySearch', () => {
  it('renders the natural-language query input', () => {
    renderHarness(vi.fn())
    expect(screen.getByLabelText('Natural language query')).toBeInTheDocument()
  })

  it('shows matching incidents after the debounce', async () => {
    renderHarness(vi.fn())
    fireEvent.change(screen.getByLabelText('Natural language query'), {
      target: { value: 'threat' },
    })
    await screen.findByText('Threat')
    expect(screen.getByText('critical')).toBeInTheDocument()
  })

  it('shows a no-match alert when the query has no results', async () => {
    renderHarness(vi.fn())
    fireEvent.change(screen.getByLabelText('Natural language query'), {
      target: { value: 'zzz' },
    })
    await screen.findByText('No incidents match your query')
  })

  it('selects an incident when a result is clicked', async () => {
    const onSelect = vi.fn()
    renderHarness(onSelect)
    fireEvent.change(screen.getByLabelText('Natural language query'), {
      target: { value: 'threat' },
    })
    const result = await screen.findByText('Threat')
    fireEvent.click(result)
    expect(onSelect).toHaveBeenCalledWith('inc-1')
  })
})

function renderHarness(onSelect: (id: string) => void) {
  return render(<Harness onSelect={onSelect} />)
}
