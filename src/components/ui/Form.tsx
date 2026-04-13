"use client"

import React from 'react'
import { Card, CardContent, Typography, TextField, MenuItem, Select, InputLabel, FormControl, Switch, FormControlLabel, Box, Button } from '@mui/material'

// Small UI kit focused on forms, tuned to your palette
// Usage: Wrap groups in <FormCard title="..."> ... </FormCard>
// Use InputField/SelectField/SwitchField for consistent spacing and look.

export function FormCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <Box className="flex items-start justify-between gap-4 mb-6">
          <Box>
            <Typography variant="h6" className="font-semibold text-ink">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" className="text-medium-gray mt-1">{subtitle}</Typography>
            )}
          </Box>
          {action}
        </Box>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

export function InputField({ label, value, onChange, type = 'text', disabled, placeholder, helperText, fullWidth = true, icon }: {
  label: string
  value: any
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  disabled?: boolean
  placeholder?: string
  helperText?: React.ReactNode
  fullWidth?: boolean
  icon?: React.ReactNode
}) {
  return (
    <TextField
      fullWidth={fullWidth}
      type={type}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      helperText={helperText}
      InputProps={icon ? { startAdornment: <span className="mr-2 text-medium-gray">{icon}</span> } : undefined}
    />
  )
}

export function SelectField<T extends string>({ label, value, onChange, options, disabled }: {
  label: string
  value: T
  onChange?: (e: any) => void
  options: Array<{ label: string; value: T }>
  disabled?: boolean
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={onChange} disabled={disabled}>
        {options.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export function SwitchField({ label, checked, onChange }: { label: string; checked: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void }) {
  return (
    <FormControlLabel control={<Switch checked={checked} onChange={onChange} color="primary" />} label={label} />
  )
}

export function FormActions({ onCancel, onSave, saveLabel = 'Guardar', isSaving = false, disabled }: {
  onCancel?: () => void
  onSave?: () => void
  saveLabel?: string
  isSaving?: boolean
  disabled?: boolean
}) {
  return (
    <Box className="flex gap-2 justify-end">
      {onCancel && (
        <Button variant="outlined" onClick={onCancel}>Cancelar</Button>
      )}
      {onSave && (
        <Button variant="contained" className="bg-brand-primary hover:bg-brand-secondary" onClick={onSave} disabled={disabled || isSaving}>
          {saveLabel}
        </Button>
      )}
    </Box>
  )
}
