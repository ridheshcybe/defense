import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material'
import type { OnboardingFormData } from '../../types'
import { MOCK_ONBOARDING_TABLES } from '../../data/mockData'

interface TablesStepProps {
  form: OnboardingFormData
  onChange: (patch: Partial<OnboardingFormData>) => void
}

export function TablesStep({ form, onChange }: TablesStepProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Pick the tables that hold raw events and the entities they refer to.
      </Typography>
      <FormControl fullWidth size="small">
        <InputLabel id="event-table-label">Event table</InputLabel>
        <Select
          labelId="event-table-label"
          label="Event table"
          value={form.eventTable}
          onChange={(event) => onChange({ eventTable: event.target.value })}
        >
          {MOCK_ONBOARDING_TABLES.eventTables.map((table) => (
            <MenuItem key={table} value={table}>
              {table}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small">
        <InputLabel id="entity-table-label">Entity table</InputLabel>
        <Select
          labelId="entity-table-label"
          label="Entity table"
          value={form.entityTable}
          onChange={(event) => onChange({ entityTable: event.target.value })}
        >
          {MOCK_ONBOARDING_TABLES.entityTables.map((table) => (
            <MenuItem key={table} value={table}>
              {table}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  )
}
