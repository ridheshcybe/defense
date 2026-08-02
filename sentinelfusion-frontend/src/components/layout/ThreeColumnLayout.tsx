import { Box, Drawer, IconButton, Tooltip, Typography } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import type { ReactNode } from 'react'
import { AOISidebar } from '../aoi/AOISidebar'
import { IncidentPanel } from '../incidents/IncidentPanel'

interface ThreeColumnLayoutProps {
  leftWidth?: number
  rightWidth?: number
  children: ReactNode
  leftOpen: boolean
  onToggleLeft: () => void
  rightOpen: boolean
  onToggleRight: () => void
}

function drawerSx(width: number, open: boolean) {
  return {
    width: open ? width : 0,
    flexShrink: 0,
    overflow: 'hidden',
    transition: 'width 200ms ease',
    '& .MuiDrawer-paper': {
      width,
      boxSizing: 'border-box',
      position: 'relative',
      overflowX: 'hidden',
    },
  }
}

function SidebarHeader({
  title,
  toggleIcon,
  toggleLabel,
  onToggle,
}: {
  title: string
  toggleIcon: ReactNode
  toggleLabel: string
  onToggle: () => void
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1.5,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="overline" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Tooltip title={toggleLabel}>
        <IconButton size="small" onClick={onToggle} aria-label={toggleLabel}>
          {toggleIcon}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

export function ThreeColumnLayout({
  leftWidth = 280,
  rightWidth = 320,
  children,
  leftOpen,
  onToggleLeft,
  rightOpen,
  onToggleRight,
}: ThreeColumnLayoutProps) {
  return (
    <Box sx={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
      <Drawer variant="persistent" anchor="left" open={leftOpen} sx={drawerSx(leftWidth, leftOpen)}>
        <SidebarHeader
          title="Areas of Interest"
          toggleIcon={<ChevronLeft />}
          toggleLabel="Collapse AOI panel"
          onToggle={onToggleLeft}
        />
        <AOISidebar />
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 400, position: 'relative' }}>
        {children}
        {!leftOpen && (
          <IconButton
            size="small"
            onClick={onToggleLeft}
            aria-label="Expand AOI panel"
            sx={{ position: 'absolute', left: 4, top: 8 }}
          >
            <ChevronRight />
          </IconButton>
        )}
        {!rightOpen && (
          <IconButton
            size="small"
            onClick={onToggleRight}
            aria-label="Expand incident panel"
            sx={{ position: 'absolute', right: 4, top: 8 }}
          >
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Drawer variant="persistent" anchor="right" open={rightOpen} sx={drawerSx(rightWidth, rightOpen)}>
        <SidebarHeader
          title="Incidents"
          toggleIcon={<ChevronRight />}
          toggleLabel="Collapse incident panel"
          onToggle={onToggleRight}
        />
        <IncidentPanel />
      </Drawer>
    </Box>
  )
}
