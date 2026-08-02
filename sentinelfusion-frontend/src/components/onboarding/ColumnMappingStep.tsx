import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material'
import type { ColumnMapping, OnboardingFormData } from '../../types'
import { MOCK_ONBOARDING_COLUMNS } from '../../data/mockData'

interface ColumnMappingStepProps {
  form: OnboardingFormData
  onChange: (patch: Partial<OnboardingFormData>) => void
}

const ONTOLOGY_FIELDS: Array<{ key: keyof ColumnMapping; label: string }> = [
  { key: 'time', label: 'Time' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'group_tag', label: 'Group tag' },
  { key: 'location', label: 'Location' },
  { key: 'severity', label: 'Severity' },
  { key: 'description', label: 'Description' },
]

export function ColumnMappingStep({ form, onChange }: ColumnMappingStepProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Map source warehouse columns onto SentinelFusion ontology fields.
      </Typography>
      {ONTOLOGY_FIELDS.map(({ key, label }) => (
        <FormControl key={key} fullWidth size="small">
          <InputLabel id={`mapping-${key}-label`}>{label}</InputLabel>
          <Select
            labelId={`mapping-${key}-label`}
            label={label}
            value={form.columnMapping[key]}
            onChange={(event) =>
              onChange({
                columnMapping: { ...form.columnMapping, [key]: event.target.value },
              })
            }
          >
            {MOCK_ONBOARDING_COLUMNS.map((column) => (
              <MenuItem key={column} value={column}>
                {column}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}
    </Stack>
  )
}
