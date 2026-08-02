import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { OnboardingWizard } from '../pages/OnboardingWizard'
import { renderWithAuth } from '../test/testUtils'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OnboardingWizard', () => {
  it('renders the stepper and the first step by default', () => {
    renderWithAuth(<OnboardingWizard />)
    for (const label of [
      'Connect warehouse',
      'Select tables',
      'Define AOIs',
      'Map columns',
      'Roles & permissions',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Warehouse type')).toBeInTheDocument()
    expect(screen.getByLabelText('Warehouse URL')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
  })

  it('keeps Next disabled until the warehouse step is filled in', () => {
    renderWithAuth(<OnboardingWizard />)
    const next = screen.getByRole('button', { name: /Next/ })
    expect(next).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Warehouse URL'), {
      target: { value: 'https://acme.snowflakecomputing.com' },
    })
    expect(next).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'analyst' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } })
    expect(next).toBeEnabled()
  })

  it('advances through the steps and logs the final form on finish', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    renderWithAuth(<OnboardingWizard />)

    // Step 1: warehouse
    fireEvent.change(screen.getByLabelText('Warehouse URL'), {
      target: { value: 'https://acme.snowflakecomputing.com' },
    })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'analyst' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()

    // Step 2: tables
    fireEvent.mouseDown(screen.getByLabelText('Event table'))
    fireEvent.click(await screen.findByRole('option', { name: 'sf_fusion_events' }))
    fireEvent.mouseDown(screen.getByLabelText('Entity table'))
    fireEvent.click(await screen.findByRole('option', { name: 'sf_entities' }))
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument()

    // Step 3: define an AOI
    fireEvent.change(screen.getByLabelText('AOI name'), { target: { value: 'Mumbai Central' } })
    fireEvent.change(screen.getByLabelText('Lat'), { target: { value: '18.9695' } })
    fireEvent.change(screen.getByLabelText('Lng'), { target: { value: '72.8199' } })
    fireEvent.click(screen.getByRole('button', { name: /Add/ }))
    expect(screen.getByText('Mumbai Central')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('Step 4 of 5')).toBeInTheDocument()

    // Step 4: map columns (exact option names; the Header chip also renders
    // "Analyst", so role rows are targeted via data-testid)
    const mappings: Array<[string, string]> = [
      ['Time', 'event_ts'],
      ['Entity ID', 'entity_id'],
      ['Group tag', 'group_tag'],
      ['Location', 'lat'],
      ['Severity', 'severity'],
      ['Description', 'description'],
    ]
    for (const [label, option] of mappings) {
      fireEvent.mouseDown(screen.getByLabelText(label))
      fireEvent.click(await screen.findByRole('option', { name: option }))
    }
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument()

    // Step 5: assign a role
    const analystRow = screen.getByTestId('role-row-analyst')
    fireEvent.click(within(analystRow).getByRole('checkbox', { name: 'Aria Singh' }))
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))

    expect(logSpy).toHaveBeenCalledTimes(1)
    const logged = String(logSpy.mock.calls[0][1])
    expect(logged).toContain('https://acme.snowflakecomputing.com')
    expect(logged).toContain('sf_fusion_events')
    expect(logged).toContain('Mumbai Central')
    expect(logged).toContain('analyst')
    expect(screen.getByText(/Configuration saved/)).toBeInTheDocument()
  })

  it('keeps Next disabled on the AOI step until at least one AOI is added', async () => {
    renderWithAuth(<OnboardingWizard />)
    // Fill the warehouse step and advance to the AOI step.
    fireEvent.change(screen.getByLabelText('Warehouse URL'), {
      target: { value: 'https://acme.snowflakecomputing.com' },
    })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'analyst' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))

    fireEvent.mouseDown(screen.getByLabelText('Event table'))
    fireEvent.click(await screen.findByRole('option', { name: 'sf_fusion_events' }))
    fireEvent.mouseDown(screen.getByLabelText('Entity table'))
    fireEvent.click(await screen.findByRole('option', { name: 'sf_entities' }))
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument()

    const next = screen.getByRole('button', { name: /Next/ })
    expect(next).toBeDisabled()
    fireEvent.change(screen.getByLabelText('AOI name'), { target: { value: 'Mumbai Central' } })
    fireEvent.change(screen.getByLabelText('Lat'), { target: { value: '18.9695' } })
    fireEvent.change(screen.getByLabelText('Lng'), { target: { value: '72.8199' } })
    fireEvent.click(screen.getByRole('button', { name: /Add/ }))
    expect(next).toBeEnabled()
  })
})
