'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Typography, Card, Button, Chip, Avatar, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  FormControl, InputLabel, Checkbox, FormControlLabel, LinearProgress, Tooltip,
} from '@mui/material'
import {
  Add, MoreVert, PushPin, PushPinOutlined, Edit as EditIcon, Delete,
  DragIndicator, AssignmentTurnedIn, StickyNote2, Close,
} from '@mui/icons-material'

// ---- Theme tokens ----
const HEAD_FONT = '"Space Grotesk", "Inter", sans-serif'
const YELLOW = '#FACC15'
const TEXT = '#0A0A0A'
const TEXT_SEC = '#57534E'
const MUTED = '#A8A29E'
const CARD_BORDER = '1px solid #E7E5E4'

// ---- Types ----
type Status = 'TODO' | 'IN_PROGRESS' | 'DONE'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface Task {
  id: string
  title: string
  description: string | null
  status: Status
  priority: Priority
  dueDate: string | null
  sortOrder: number
  assigneeId: string | null
  assigneeName: string | null
  createdById: string
  createdByName: string
  createdAt: string
  completedAt: string | null
}
interface Note {
  id: string
  content: string
  color: string
  pinned: boolean
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
}
interface Member { id: string; name: string; role: string }
interface Me { id: string; name: string; role: string; isAdmin: boolean }
interface BoardData { me: Me; members: Member[]; tasks: Task[]; notes: Note[] }

// ---- Column config ----
const COLUMNS: { status: Status; label: string }[] = [
  { status: 'TODO', label: 'Por hacer' },
  { status: 'IN_PROGRESS', label: 'En progreso' },
  { status: 'DONE', label: 'Hecho' },
]

const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Baja', color: '#57534E', bg: '#F5F5F4' },
  MEDIUM: { label: 'Media', color: '#1D4ED8', bg: '#DBEAFE' },
  HIGH: { label: 'Alta', color: '#C2410C', bg: '#FFEDD5' },
  URGENT: { label: 'Urgente', color: '#B91C1C', bg: '#FEE2E2' },
}

const NOTE_COLORS: { key: string; bg: string; label: string }[] = [
  { key: 'yellow', bg: '#FEF3C7', label: 'Amarillo' },
  { key: 'pink', bg: '#FCE7F3', label: 'Rosa' },
  { key: 'blue', bg: '#DBEAFE', label: 'Azul' },
  { key: 'green', bg: '#DCFCE7', label: 'Verde' },
  { key: 'orange', bg: '#FFEDD5', label: 'Naranja' },
]
const noteBg = (color: string) => NOTE_COLORS.find(c => c.key === color)?.bg || '#FEF3C7'

// ---- Helpers ----
const initials = (name?: string | null) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('') || '?'

const fmtDate = (iso?: string | null) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-PA', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

const isOverdue = (task: Task) => {
  if (!task.dueDate || task.status === 'DONE') return false
  const d = new Date(task.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

// ---- Task dialog form shape ----
interface TaskForm {
  title: string
  description: string
  assigneeId: string
  priority: Priority
  dueDate: string
  status: Status
}
const emptyTaskForm: TaskForm = {
  title: '', description: '', assigneeId: '', priority: 'MEDIUM', dueDate: '', status: 'TODO',
}

export default function TableroPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null)

  // Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTaskForm)
  const [savingTask, setSavingTask] = useState(false)

  // Note dialog
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [noteColor, setNoteColor] = useState('yellow')
  const [notePinned, setNotePinned] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  // card "⋮" menu
  const [cardMenuAnchor, setCardMenuAnchor] = useState<null | HTMLElement>(null)
  const [cardMenuTask, setCardMenuTask] = useState<Task | null>(null)

  const me = data?.me
  const members = data?.members || []

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/tablero')
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setData(json)
    } catch {
      // keep prior data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  // ---- Notes sorted: pinned first, then most recent ----
  const sortedNotes = useMemo(() => {
    const notes = data?.notes ? [...data.notes] : []
    return notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    })
  }, [data?.notes])

  // ---- Tasks grouped by column, preserving array order ----
  const tasksByStatus = useMemo(() => {
    const groups: Record<Status, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] }
    ;(data?.tasks || []).forEach(t => {
      groups[t.status]?.push(t)
    })
    return groups
  }, [data?.tasks])

  const canModifyTask = (task: Task) => !!me && (me.isAdmin || task.createdById === me.id)
  const canModifyNote = (note: Note) => !!me && (me.isAdmin || note.authorId === me.id)

  // ---- Move task (optimistic + refetch) ----
  const moveTask = async (task: Task, status: Status) => {
    if (task.status === status) return
    setData(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === task.id ? { ...t, status } : t),
    } : prev)
    try {
      await fetch(`/api/tablero/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch {
      // ignore
    } finally {
      fetchBoard()
    }
  }

  // ---- Drag & drop ----
  const onDragStart = (e: React.DragEvent, task: Task) => {
    setDragId(task.id)
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragEnd = () => {
    setDragId(null)
    setDragOverCol(null)
  }
  const onColumnDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragId
    setDragOverCol(null)
    setDragId(null)
    if (!id) return
    const task = data?.tasks.find(t => t.id === id)
    if (task) moveTask(task, status)
  }

  // ---- Task dialog handlers ----
  const openNewTask = () => {
    setEditingTask(null)
    setTaskForm(emptyTaskForm)
    setTaskDialogOpen(true)
  }
  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assigneeId: task.assigneeId || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      status: task.status,
    })
    setTaskDialogOpen(true)
  }
  const saveTask = async () => {
    if (!taskForm.title.trim()) return
    setSavingTask(true)
    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      assigneeId: taskForm.assigneeId || null,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate || null,
      status: taskForm.status,
    }
    try {
      if (editingTask) {
        await fetch(`/api/tablero/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/tablero/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setTaskDialogOpen(false)
      await fetchBoard()
    } catch {
      // ignore
    } finally {
      setSavingTask(false)
    }
  }
  const deleteTask = async () => {
    if (!editingTask) return
    setSavingTask(true)
    try {
      await fetch(`/api/tablero/tasks/${editingTask.id}`, { method: 'DELETE' })
      setTaskDialogOpen(false)
      await fetchBoard()
    } catch {
      // ignore
    } finally {
      setSavingTask(false)
    }
  }

  // ---- Note dialog handlers ----
  const openNewNote = () => {
    setEditingNote(null)
    setNoteContent('')
    setNoteColor('yellow')
    setNotePinned(false)
    setNoteDialogOpen(true)
  }
  const openEditNote = (note: Note) => {
    setEditingNote(note)
    setNoteContent(note.content)
    setNoteColor(note.color)
    setNotePinned(note.pinned)
    setNoteDialogOpen(true)
  }
  const saveNote = async () => {
    if (!noteContent.trim()) return
    setSavingNote(true)
    const payload = { content: noteContent.trim(), color: noteColor, pinned: notePinned }
    try {
      if (editingNote) {
        await fetch(`/api/tablero/notes/${editingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/tablero/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setNoteDialogOpen(false)
      await fetchBoard()
    } catch {
      // ignore
    } finally {
      setSavingNote(false)
    }
  }
  const togglePin = async (note: Note) => {
    setData(prev => prev ? {
      ...prev,
      notes: prev.notes.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n),
    } : prev)
    try {
      await fetch(`/api/tablero/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !note.pinned }),
      })
    } catch {
      // ignore
    } finally {
      fetchBoard()
    }
  }
  const deleteNote = async (note: Note) => {
    setData(prev => prev ? { ...prev, notes: prev.notes.filter(n => n.id !== note.id) } : prev)
    try {
      await fetch(`/api/tablero/notes/${note.id}`, { method: 'DELETE' })
    } catch {
      // ignore
    } finally {
      fetchBoard()
    }
  }

  // ---- card menu ----
  const openCardMenu = (e: React.MouseEvent<HTMLElement>, task: Task) => {
    e.stopPropagation()
    setCardMenuAnchor(e.currentTarget)
    setCardMenuTask(task)
  }
  const closeCardMenu = () => {
    setCardMenuAnchor(null)
    setCardMenuTask(null)
  }

  // -------------------- RENDER --------------------
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, mb: 0.4 }}>
            <AssignmentTurnedIn sx={{ color: YELLOW, fontSize: 28 }} />
            <Typography sx={{ fontFamily: HEAD_FONT, fontSize: '1.5rem', fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>
              Tablero de Tareas
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: TEXT_SEC }}>
            Asigna tareas al equipo y comparte recordatorios importantes.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openNewTask}
          sx={{
            bgcolor: YELLOW, color: TEXT, textTransform: 'none', fontWeight: 700,
            borderRadius: '999px', px: 2.4, py: 1, boxShadow: 'none',
            '&:hover': { bgcolor: '#EAB308', boxShadow: 'none' },
          }}
        >
          Nueva tarea
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 2, '& .MuiLinearProgress-bar': { bgcolor: YELLOW }, bgcolor: '#FEF3C7' }} />}

      {/* ---- Team notes ---- */}
      <Card sx={{ p: 2.4, mb: 3.2, bgcolor: '#FFFFFF', border: CARD_BORDER, borderRadius: '16px', boxShadow: '0 1px 2px rgba(10,10,10,0.04)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: sortedNotes.length ? 2 : 0.5, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StickyNote2 sx={{ color: MUTED, fontSize: 20 }} />
            <Typography sx={{ fontFamily: HEAD_FONT, fontWeight: 700, fontSize: '1rem', color: TEXT }}>
              Notas del equipo
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<Add />}
            onClick={openNewNote}
            sx={{
              textTransform: 'none', fontWeight: 600, color: TEXT, borderRadius: '999px',
              bgcolor: '#F5F5F4', px: 1.6, '&:hover': { bgcolor: '#FEF3C7' },
            }}
          >
            Nota
          </Button>
        </Box>

        {sortedNotes.length === 0 ? (
          <Typography variant="body2" sx={{ color: MUTED, py: 1 }}>
            Sin notas todavía. Crea un recordatorio para que todo el equipo lo vea.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.6 }}>
            {sortedNotes.map(note => (
              <Box
                key={note.id}
                sx={{
                  width: { xs: '100%', sm: 240 },
                  bgcolor: noteBg(note.color),
                  borderRadius: '14px',
                  p: 1.8,
                  border: '1px solid rgba(10,10,10,0.06)',
                  boxShadow: note.pinned ? '0 4px 14px -4px rgba(10,10,10,0.18)' : '0 1px 2px rgba(10,10,10,0.05)',
                  display: 'flex', flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5, mb: 0.8 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {note.pinned && <Typography component="span" sx={{ fontSize: '0.95rem', lineHeight: 1 }}>📌</Typography>}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.2, mr: -0.6, mt: -0.6 }}>
                    <Tooltip title={note.pinned ? 'Desfijar' : 'Fijar'}>
                      <IconButton size="small" onClick={() => togglePin(note)} sx={{ p: 0.4, color: 'rgba(10,10,10,0.55)' }}>
                        {note.pinned ? <PushPin sx={{ fontSize: 16 }} /> : <PushPinOutlined sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Tooltip>
                    {canModifyNote(note) && (
                      <>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEditNote(note)} sx={{ p: 0.4, color: 'rgba(10,10,10,0.55)' }}>
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => deleteNote(note)} sx={{ p: 0.4, color: 'rgba(10,10,10,0.55)', '&:hover': { color: '#B91C1C' } }}>
                            <Delete sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '0.86rem', color: '#1C1917', whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 1.2, flex: 1 }}>
                  {note.content}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(10,10,10,0.08)', pt: 0.8 }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(10,10,10,0.6)' }}>{note.authorName}</Typography>
                  <Typography sx={{ fontSize: '0.66rem', color: 'rgba(10,10,10,0.45)' }}>{fmtDate(note.createdAt)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Card>

      {/* ---- Kanban board ---- */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2.4,
          alignItems: 'start',
        }}
      >
        {COLUMNS.map(col => {
          const colTasks = tasksByStatus[col.status]
          const active = dragOverCol === col.status
          return (
            <Box
              key={col.status}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status) }}
              onDragLeave={() => setDragOverCol(prev => prev === col.status ? null : prev)}
              onDrop={(e) => onColumnDrop(e, col.status)}
              sx={{
                bgcolor: active ? '#FEF3C7' : '#F5F5F4',
                border: active ? `1.5px dashed ${YELLOW}` : '1px solid #E7E5E4',
                borderRadius: '16px',
                p: 1.6,
                minHeight: 200,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {/* Column header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.6, mb: 1.4 }}>
                <Typography sx={{ fontFamily: HEAD_FONT, fontWeight: 700, fontSize: '0.92rem', color: TEXT }}>
                  {col.label}
                </Typography>
                <Chip
                  label={colTasks.length}
                  size="small"
                  sx={{ height: 22, minWidth: 28, fontWeight: 700, fontSize: '0.72rem', bgcolor: '#FFFFFF', color: TEXT_SEC, border: CARD_BORDER }}
                />
              </Box>

              {/* Tasks */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
                {colTasks.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center', color: MUTED, fontSize: '0.82rem' }}>
                    Sin tareas
                  </Box>
                ) : (
                  colTasks.map(task => {
                    const pr = PRIORITY_META[task.priority]
                    const overdue = isOverdue(task)
                    return (
                      <Card
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                        onDragEnd={onDragEnd}
                        onClick={() => openEditTask(task)}
                        sx={{
                          bgcolor: '#FFFFFF',
                          border: CARD_BORDER,
                          borderRadius: '14px',
                          p: 1.6,
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(10,10,10,0.05)',
                          opacity: dragId === task.id ? 0.5 : 1,
                          transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.1s',
                          '&:hover': { borderColor: '#D6D3D1', boxShadow: '0 6px 16px -8px rgba(10,10,10,0.2)' },
                          '&:active': { cursor: 'grabbing' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                          <DragIndicator sx={{ fontSize: 16, color: '#D6D3D1', mt: 0.2, cursor: 'grab' }} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: TEXT, flex: 1, lineHeight: 1.3 }}>
                            {task.title}
                          </Typography>
                          <IconButton size="small" onClick={(e) => openCardMenu(e, task)} sx={{ p: 0.3, mt: -0.4, mr: -0.4, color: MUTED }}>
                            <MoreVert sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>

                        {task.description && (
                          <Typography
                            sx={{
                              fontSize: '0.78rem', color: TEXT_SEC, mt: 0.6, ml: 2.6,
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {task.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mt: 1.2, ml: 2.6 }}>
                          <Chip
                            label={pr.label}
                            size="small"
                            sx={{ height: 20, fontWeight: 700, fontSize: '0.66rem', bgcolor: pr.bg, color: pr.color }}
                          />
                          {task.dueDate && (
                            <Chip
                              label={fmtDate(task.dueDate)}
                              size="small"
                              sx={{
                                height: 20, fontWeight: 600, fontSize: '0.66rem',
                                bgcolor: overdue ? '#FEE2E2' : '#F5F5F4',
                                color: overdue ? '#B91C1C' : TEXT_SEC,
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1.2, ml: 2.6 }}>
                          {task.assigneeName ? (
                            <>
                              <Avatar sx={{ width: 22, height: 22, fontSize: '0.62rem', fontWeight: 700, bgcolor: YELLOW, color: TEXT }}>
                                {initials(task.assigneeName)}
                              </Avatar>
                              <Typography sx={{ fontSize: '0.74rem', color: TEXT_SEC, fontWeight: 500 }}>{task.assigneeName}</Typography>
                            </>
                          ) : (
                            <>
                              <Avatar sx={{ width: 22, height: 22, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#E7E5E4', color: MUTED }}>
                                ?
                              </Avatar>
                              <Typography sx={{ fontSize: '0.74rem', color: MUTED, fontStyle: 'italic' }}>Sin asignar</Typography>
                            </>
                          )}
                        </Box>
                      </Card>
                    )
                  })
                )}
              </Box>
            </Box>
          )
        })}
      </Box>

      {/* ---- Card "⋮" menu (fallback move) ---- */}
      <Menu
        anchorEl={cardMenuAnchor}
        open={Boolean(cardMenuAnchor)}
        onClose={closeCardMenu}
        PaperProps={{ sx: { borderRadius: '12px', border: CARD_BORDER, boxShadow: '0 14px 30px -10px rgba(10,10,10,0.2)', minWidth: 200 } }}
      >
        <Typography sx={{ px: 2, py: 0.8, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
          Mover a
        </Typography>
        {COLUMNS.map(col => (
          <MenuItem
            key={col.status}
            disabled={cardMenuTask?.status === col.status}
            onClick={() => { if (cardMenuTask) moveTask(cardMenuTask, col.status); closeCardMenu() }}
            sx={{ fontSize: '0.84rem', py: 1, '&:hover': { bgcolor: '#FEF3C7' } }}
          >
            {col.label}
          </MenuItem>
        ))}
      </Menu>

      {/* ---- Task dialog ---- */}
      <Dialog
        open={taskDialogOpen}
        onClose={() => !savingTask && setTaskDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', border: CARD_BORDER } }}
      >
        <DialogTitle sx={{ fontFamily: HEAD_FONT, fontWeight: 700, color: TEXT, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingTask ? 'Editar tarea' : 'Nueva tarea'}
          <IconButton size="small" onClick={() => setTaskDialogOpen(false)} sx={{ color: MUTED }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Título"
            required
            value={taskForm.title}
            onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
            fullWidth
            autoFocus
          />
          <TextField
            label="Descripción"
            value={taskForm.description}
            onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
          <FormControl fullWidth>
            <InputLabel>Asignar a</InputLabel>
            <Select
              label="Asignar a"
              value={taskForm.assigneeId}
              onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))}
            >
              <MenuItem value=""><em>Sin asignar</em></MenuItem>
              {members.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ flex: 1, minWidth: 140 }}>
              <InputLabel>Prioridad</InputLabel>
              <Select
                label="Prioridad"
                value={taskForm.priority}
                onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as Priority }))}
              >
                {(Object.keys(PRIORITY_META) as Priority[]).map(p => (
                  <MenuItem key={p} value={p}>{PRIORITY_META[p].label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Fecha límite"
              type="date"
              value={taskForm.dueDate}
              onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 140 }}
            />
          </Box>
          {editingTask && (
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={taskForm.status}
                onChange={e => setTaskForm(f => ({ ...f, status: e.target.value as Status }))}
              >
                {COLUMNS.map(c => <MenuItem key={c.status} value={c.status}>{c.label}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4, justifyContent: 'space-between' }}>
          <Box>
            {editingTask && canModifyTask(editingTask) && (
              <Button
                onClick={deleteTask}
                disabled={savingTask}
                startIcon={<Delete />}
                sx={{ textTransform: 'none', color: '#B91C1C', '&:hover': { bgcolor: '#FEF2F2' } }}
              >
                Eliminar
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setTaskDialogOpen(false)} disabled={savingTask} sx={{ textTransform: 'none', color: TEXT_SEC }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={saveTask}
              disabled={savingTask || !taskForm.title.trim()}
              sx={{ bgcolor: YELLOW, color: TEXT, textTransform: 'none', fontWeight: 700, borderRadius: '999px', px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#EAB308', boxShadow: 'none' } }}
            >
              {editingTask ? 'Guardar' : 'Crear'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ---- Note dialog ---- */}
      <Dialog
        open={noteDialogOpen}
        onClose={() => !savingNote && setNoteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', border: CARD_BORDER } }}
      >
        <DialogTitle sx={{ fontFamily: HEAD_FONT, fontWeight: 700, color: TEXT, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingNote ? 'Editar nota' : 'Nueva nota'}
          <IconButton size="small" onClick={() => setNoteDialogOpen(false)} sx={{ color: MUTED }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Contenido"
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            autoFocus
          />
          <Box>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT_SEC, mb: 1 }}>Color</Typography>
            <Box sx={{ display: 'flex', gap: 1.2 }}>
              {NOTE_COLORS.map(c => (
                <Tooltip key={c.key} title={c.label}>
                  <Box
                    onClick={() => setNoteColor(c.key)}
                    sx={{
                      width: 34, height: 34, borderRadius: '10px', bgcolor: c.bg, cursor: 'pointer',
                      border: noteColor === c.key ? `2px solid ${TEXT}` : '1px solid rgba(10,10,10,0.1)',
                      transition: 'border 0.12s, transform 0.12s',
                      '&:hover': { transform: 'scale(1.08)' },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
          <FormControlLabel
            control={<Checkbox checked={notePinned} onChange={e => setNotePinned(e.target.checked)} sx={{ color: MUTED, '&.Mui-checked': { color: YELLOW } }} />}
            label={<Typography sx={{ fontSize: '0.86rem', color: TEXT }}>Fijar nota (📌 aparece primero)</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button onClick={() => setNoteDialogOpen(false)} disabled={savingNote} sx={{ textTransform: 'none', color: TEXT_SEC }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={saveNote}
            disabled={savingNote || !noteContent.trim()}
            sx={{ bgcolor: YELLOW, color: TEXT, textTransform: 'none', fontWeight: 700, borderRadius: '999px', px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#EAB308', boxShadow: 'none' } }}
          >
            {editingNote ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
