import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from '@mui/material'
import type { OnboardingFormData, UserRole } from '../../types'
import { MOCK_ONBOARDING_USERS } from '../../data/mockData'

interface RolesStepProps {
  form: OnboardingFormData
  onChange: (patch: Partial<OnboardingFormData>) => void
}

const ROLES: Array<{ role: UserRole; label: string; description: string }> = [
  { role: 'analyst', label: 'Analyst', description: 'Monitor AOIs, triage incidents' },
  { role: 'field_ops', label: 'Field Ops', description: 'Respond to assigned incidents' },
  { role: 'leadership', label: 'Leadership', description: 'Executive KPIs and reports' },
  { role: 'crew_transport', label: 'Crew Transport', description: 'Run supply and transport routes' },
]

export function RolesStep({ form, onChange }: RolesStepProps) {
  const toggleUser = (role: UserRole, userId: string) => {
    const current = form.roleAssignments[role]
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    onChange({ roleAssignments: { ...form.roleAssignments, [role]: next } })
  }

  return (
    <Stack spacing={2}>
      {ROLES.map(({ role, label, description }) => (
        <Stack key={role} spacing={0.5} data-testid={`role-row-${role}`}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          </Stack>
          <FormGroup row>
            {MOCK_ONBOARDING_USERS.map((user) => (
              <FormControlLabel
                key={user.id}
                control={
                  <Checkbox
                    size="small"
                    checked={form.roleAssignments[role].includes(user.id)}
                    onChange={() => toggleUser(role, user.id)}
                  />
                }
                label={user.name}
              />
            ))}
          </FormGroup>
        </Stack>
      ))}
    </Stack>
  )
}
