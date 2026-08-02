import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FieldOpsProvider, useFieldOps } from '../contexts/FieldOpsContext'
import { resetFieldOpsStore } from '../api/fieldOpsApi'
import { MOCK_FIELD_OPS_USERS } from '../data/mockData'

function Probe() {
  const {
    incidents,
    currentUser,
    isLoading,
    error,
    toast,
    updateIncidentStatus,
    addNote,
    refetch,
  } = useFieldOps()
  return (
    <div>
      <span data-testid="count">{incidents.length}</span>
      <span data-testid="current-user">{currentUser.name}</span>
      <span data-testid="status">{incidents[0]?.status ?? 'none'}</span>
      <span data-testid="activity">{incidents[0]?.activityLog.length ?? 0}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{error ?? 'none'}</span>
      <span data-testid="toast">{toast?.message ?? 'none'}</span>
      <button type="button" onClick={() => updateIncidentStatus(incidents[0].id, 'in-progress')}>
        update status
      </button>
      <button type="button" onClick={() => addNote(incidents[0].id, 'Observation logged')}>
        add note
      </button>
      <button type="button" onClick={refetch}>
        refetch
      </button>
    </div>
  )
}

function renderProvider() {
  return render(
    <FieldOpsProvider>
      <Probe />
    </FieldOpsProvider>,
  )
}

describe('FieldOpsContext', () => {
  beforeEach(() => {
    resetFieldOpsStore()
    vi.clearAllMocks()
  })

  it('loads the work queue for the current user', async () => {
    renderProvider()
    expect(screen.getByTestId('loading').textContent).toBe('true')
    expect(screen.getByTestId('current-user').textContent).toBe(MOCK_FIELD_OPS_USERS[0].name)
    // Assigned (inc-2, inc-3, inc-6) + open unassigned (inc-1, inc-8) = 5.
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('5'))
    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('error').textContent).toBe('none')
  })

  it('updates incident status and shows a toast', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('5'))
    expect(screen.getByTestId('status').textContent).toBe('open')
    fireEvent.click(screen.getByText('update status'))
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('in-progress'))
    expect(screen.getByTestId('toast').textContent).toBe('Incident status updated')
    // Timeline gains a status event (inc-1 starts with 1 activity event).
    await waitFor(() => expect(screen.getByTestId('activity').textContent).toBe('2'))
  })

  it('adds a note to the incident timeline and shows a toast', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('5'))
    const before = Number(screen.getByTestId('activity').textContent)
    fireEvent.click(screen.getByText('add note'))
    await waitFor(() =>
      expect(Number(screen.getByTestId('activity').textContent)).toBe(before + 1),
    )
    expect(screen.getByTestId('toast').textContent).toBe('Note added')
  })

  it('refetches on demand', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('5'))
    fireEvent.click(screen.getByText('refetch'))
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('count').textContent).toBe('5')
  })
})
