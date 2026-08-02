import { FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'
import type { OnboardingFormData, WarehouseType } from '../../types'

interface WarehouseStepProps {
  form: OnboardingFormData
  onChange: (patch: Partial<OnboardingFormData>) => void
}

export function WarehouseStep({ form, onChange }: WarehouseStepProps) {
  return (
    <Stack spacing={2}>
      <FormControl fullWidth size="small">
        <InputLabel id="warehouse-type-label">Warehouse type</InputLabel>
        <Select
          labelId="warehouse-type-label"
          label="Warehouse type"
          value={form.warehouseType}
          onChange={(event) => onChange({ warehouseType: event.target.value as WarehouseType })}
        >
          <MenuItem value="snowflake">Snowflake</MenuItem>
          <MenuItem value="databricks">Databricks</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Warehouse URL"
        placeholder="https://account.snowflakecomputing.com"
        value={form.warehouseUrl}
        onChange={(event) => onChange({ warehouseUrl: event.target.value })}
        fullWidth
        size="small"
      />
      <TextField
        label="Username"
        value={form.warehouseUser}
        onChange={(event) => onChange({ warehouseUser: event.target.value })}
        fullWidth
        size="small"
        autoComplete="username"
      />
      <TextField
        label="Password"
        type="password"
        value={form.warehousePassword}
        onChange={(event) => onChange({ warehousePassword: event.target.value })}
        fullWidth
        size="small"
        autoComplete="current-password"
      />
    </Stack>
  )
}
