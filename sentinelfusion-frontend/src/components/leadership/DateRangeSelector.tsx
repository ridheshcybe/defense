import { useState } from 'react'
import { Paper, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import type { DateRange, DateRangePreset } from '../../types'

const PRESETS: Array<{ key: DateRangePreset; label: string }> = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: 'custom', label: 'Custom' },
]

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [customFrom, setCustomFrom] = useState(value.from)
  const [customTo, setCustomTo] = useState(value.to)

  const applyPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      onChange({ preset: 'custom', from: customFrom, to: customTo })
      return
    }
    const to = new Date().toISOString().slice(0, 10)
    const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30
    const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
    onChange({ preset, from, to })
  }

  const applyCustom = (from: string, to: string) => {
    setCustomFrom(from)
    setCustomTo(to)
    // Only push a custom range once both dates are set (demo: no from>to validation).
    if (from && to) onChange({ preset: 'custom', from, to })
  }

  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
        <ToggleButtonGroup
          size="small"
          exclusive
          value={value.preset}
          onChange={(_, next: DateRangePreset | null) => {
            if (next) applyPreset(next)
          }}
          aria-label="Date range"
        >
          {PRESETS.map((preset) => (
            <ToggleButton key={preset.key} value={preset.key}>
              {preset.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {value.preset === 'custom' && (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              type="date"
              size="small"
              aria-label="From date"
              value={customFrom}
              onChange={(e) => applyCustom(e.target.value, customTo)}
            />
            <TextField
              type="date"
              size="small"
              aria-label="To date"
              value={customTo}
              onChange={(e) => applyCustom(customFrom, e.target.value)}
            />
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
