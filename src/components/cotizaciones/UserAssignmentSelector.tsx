'use client'

import { useState, useEffect } from 'react'
import { Autocomplete, TextField, Box, Typography, Chip } from '@mui/material'
import { PersonOutline } from '@mui/icons-material'

interface UserOption {
  id: string | null
  name: string
  email: string
  role: string
}

const NO_ACCOUNT: UserOption = { id: null, name: 'Sin cuenta (manual)', email: '', role: '' }

interface Props {
  value: string | null
  onChange: (userId: string | null, userName: string) => void
}

export function UserAssignmentSelector({ value, onChange }: Props) {
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) { setUsers([]); return }
        const filtered = data
          .filter(u => u.isActive && (u.role === 'BUSINESS_USER' || u.role === 'CUSTOMER_USER'))
          .map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
        setUsers(filtered)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const options = [NO_ACCOUNT, ...users]
  const selected = value ? users.find(u => u.id === value) || null : NO_ACCOUNT

  return (
    <Autocomplete
      size="small"
      options={options}
      loading={loading}
      value={selected}
      onChange={(_, opt) => {
        if (!opt || !opt.id) {
          onChange(null, '')
        } else {
          onChange(opt.id, opt.name)
        }
      }}
      getOptionLabel={opt => opt.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      renderOption={(props, opt) => (
        <Box component="li" {...props} key={opt.id || 'no-account'} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonOutline sx={{ fontSize: 18, color: opt.id ? '#3B82F6' : '#9CA3AF' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
              {opt.name}
            </Typography>
            {opt.email && (
              <Typography variant="caption" sx={{ color: '#6B7280' }}>{opt.email}</Typography>
            )}
          </Box>
          {opt.role && (
            <Chip label={opt.role === 'BUSINESS_USER' ? 'Business' : 'Customer'} size="small"
              sx={{ height: 20, fontWeight: 700, fontSize: '0.6rem',
                bgcolor: opt.role === 'BUSINESS_USER' ? '#DBEAFE' : '#D1FAE5',
                color: opt.role === 'BUSINESS_USER' ? '#1D4ED8' : '#065F46' }} />
          )}
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params} label="Asignar a usuario (opcional)" placeholder="Buscar usuario..." />
      )}
    />
  )
}
