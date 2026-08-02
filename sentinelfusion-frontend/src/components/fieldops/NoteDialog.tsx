import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'

interface NoteDialogProps {
  open: boolean
  onCancel: () => void
  onSubmit: (note: string) => void
}

export function NoteDialog({ open, onCancel, onSubmit }: NoteDialogProps) {
  const [note, setNote] = useState('')

  const close = () => {
    setNote('')
    onCancel()
  }

  const submit = () => {
    if (!note.trim()) return
    onSubmit(note.trim())
    setNote('')
    onCancel()
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>Add Note</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          multiline
          minRows={3}
          fullWidth
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Log an observation…"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!note.trim()}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}
