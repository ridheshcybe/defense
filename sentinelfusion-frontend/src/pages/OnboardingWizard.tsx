import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { Header } from '../components/layout/Header'
import { WarehouseStep } from '../components/onboarding/WarehouseStep'
import { TablesStep } from '../components/onboarding/TablesStep'
import { AOIStep } from '../components/onboarding/AOIStep'
import { ColumnMappingStep } from '../components/onboarding/ColumnMappingStep'
import { RolesStep } from '../components/onboarding/RolesStep'
import type { OnboardingFormData } from '../types'
import { useAuth } from '../contexts/AuthContext'

const STEPS = ['Connect warehouse', 'Select tables', 'Define AOIs', 'Map columns', 'Roles & permissions']

const INITIAL_FORM: OnboardingFormData = {
  warehouseType: 'snowflake',
  warehouseUrl: '',
  warehouseUser: '',
  warehousePassword: '',
  eventTable: '',
  entityTable: '',
  aois: [],
  columnMapping: {
    time: '',
    entity_id: '',
    group_tag: '',
    location: '',
    severity: '',
    description: '',
  },
  roleAssignments: {
    analyst: [],
    field_ops: [],
    leadership: [],
    crew_transport: [],
  },
}

export function OnboardingWizard() {
  const { logout } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [form, setForm] = useState<OnboardingFormData>(INITIAL_FORM)
  const [finished, setFinished] = useState(false)

  const patch = (update: Partial<OnboardingFormData>) => setForm((prev) => ({ ...prev, ...update }))

  const stepValid = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          form.warehouseUrl.trim() !== '' &&
          form.warehouseUser.trim() !== '' &&
          form.warehousePassword.trim() !== ''
        )
      case 1:
        return form.eventTable !== '' && form.entityTable !== ''
      case 2:
        return form.aois.length > 0
      case 3:
        return Object.values(form.columnMapping).every((value) => value !== '')
      case 4:
        return Object.values(form.roleAssignments).some((users) => users.length > 0)
      default:
        return false
    }
  }, [activeStep, form])

  const handleNext = () => {
    if (activeStep === STEPS.length - 1) {
      // T29 scaffold: no backend yet — just log the assembled config.
      console.log('Onboarding complete:', JSON.stringify(form, null, 2))
      setFinished(true)
    } else {
      setActiveStep((step) => step + 1)
    }
  }

  const handleBack = () => setActiveStep((step) => Math.max(0, step - 1))

  const handleReset = () => {
    setForm(INITIAL_FORM)
    setActiveStep(0)
    setFinished(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Header userRole="analyst" onLogout={logout} />
      <Box sx={{ maxWidth: 720, width: '100%', mx: 'auto', p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Set up SentinelFusion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect your data warehouse and define how events become AOIs and incidents.
            </Typography>
          </Stack>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ py: 1 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Card variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            {finished ? (
              <Stack spacing={2} alignItems="center">
                <Alert severity="success" sx={{ width: '100%' }}>
                  Configuration saved. Check the console for the assembled form values.
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  This scaffold does not talk to a backend yet — the values above were logged.
                </Typography>
                <Button variant="outlined" onClick={handleReset}>
                  Start over
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="overline" color="text.secondary">
                  Step {activeStep + 1} of {STEPS.length}
                </Typography>

                {activeStep === 0 && <WarehouseStep form={form} onChange={patch} />}
                {activeStep === 1 && <TablesStep form={form} onChange={patch} />}
                {activeStep === 2 && <AOIStep form={form} onChange={patch} />}
                {activeStep === 3 && <ColumnMappingStep form={form} onChange={patch} />}
                {activeStep === 4 && <RolesStep form={form} onChange={patch} />}

                <Stack direction="row" spacing={1} justifyContent="space-between">
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={activeStep === STEPS.length - 1 ? <Check /> : <ArrowForward />}
                    disabled={!stepValid}
                    onClick={handleNext}
                  >
                    {activeStep === STEPS.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
