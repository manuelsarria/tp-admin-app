'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock, Security } from '@mui/icons-material'
import Image from 'next/image'
import { LoginForm } from '@/types'

export function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)
  const [totpCode, setTotpCode] = useState('')

  // Inline validation state
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailError = emailTouched && !emailRegex.test(formData.email)
  const passwordError = passwordTouched && formData.password.length < 6
  const isFormValid = emailRegex.test(formData.email) && formData.password.length >= 6

  // Prefill email if user chose "Recordarme"
  useEffect(() => {
    const savedEmail = localStorage.getItem('saved-email')
    const remember = localStorage.getItem('remember-me') === 'true'
    if (savedEmail && remember) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }))
    }
  }, [])

  const handleInputChange = (field: keyof LoginForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? event.target.checked : event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear banner error as user edits
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Persist or clear remembered email before attempting login
    if (formData.rememberMe) {
      localStorage.setItem('saved-email', formData.email)
      localStorage.setItem('remember-me', 'true')
    } else {
      localStorage.removeItem('saved-email')
      localStorage.setItem('remember-me', 'false')
    }

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        totp: totpCode || '',
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes('2FA_REQUIRED')) {
          setNeeds2FA(true)
          setError('')
        } else if (result.error.includes('2FA_INVALID')) {
          setError('Código 2FA inválido. Intenta de nuevo.')
          setTotpCode('')
        } else {
          setError('Credenciales inválidas. Verifica tu email y contraseña.')
        }
      } else if (result?.ok) {
        localStorage.setItem('show-welcome-popup', 'true')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Mock password reset
      alert('Se ha enviado un enlace de recuperación a tu email')
      setShowResetPassword(false)
      setResetEmail('')
    } catch (err) {
      setError('Error al enviar email de recuperación')
    } finally {
      setIsLoading(false)
    }
  }

  if (showResetPassword) {
    return (
      <Box className="min-h-screen bg-general-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <Box className="text-center mb-6">
              <Typography variant="h4" className="font-bold text-ink mb-2">
                Recuperar Contraseña
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Ingresa tu email para recibir un enlace de recuperación
              </Typography>
            </Box>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email className="text-medium-gray" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                className="mt-6 bg-brand-primary hover:bg-brand-secondary"
              >
                {isLoading ? 'Enviando...' : 'Enviar enlace'}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={() => setShowResetPassword(false)}
                className="mt-2"
              >
                Volver al login
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box className="min-h-screen bg-general-bg flex">
      {/* Left side - Visual (wider on large screens) */}
      <Box className="hidden lg:flex lg:basis-7/12 xl:basis-2/3 relative overflow-hidden">
        <Image
          src="/images/login-hero.png"
          alt="Container Ship"
          fill
          priority
          // Use the actual column widths to hint the browser
          sizes="(min-width: 1280px) 66vw, (min-width: 1024px) 58vw, 0vw"
          // Anchor crop to the right so the right side remains visible
          className="object-cover object-right"
        />
        <Box className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/10" />
        <Box className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center text-white p-8">
          {/* <Typography variant="h2" className="font-bold mb-4">
            TP Logistics
          </Typography>
          <Typography variant="h5" className="opacity-90">
            Sistema de Gestión Logística
          </Typography> */}
        </Box>
      </Box>

      {/* Right side - Login Form (narrower than left on large screens) */}
      <Box className="w-full lg:basis-5/12 xl:basis-1/3 flex items-center justify-center p-6 lg:p-8">
        <Card className="w-full max-w-md rounded-2xl shadow-xl">
          <CardContent className="p-8">
            {/* Logo and Title */}
            <Box className="text-center mb-8">
              <Box className="mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="/images/TP-Logo.png"
                  alt="TP Logistics logo"
                  width={160}
                  height={40}
                  priority
                  sizes="(max-width: 600px) 120px, 160px"
                  className="h-10 w-auto object-contain"
                />
              </Box>
              <Typography variant="h4" className="font-bold text-ink mb-2">
                Bienvenido
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Inicia sesión en tu cuenta de TP Logistics
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <TextField
                fullWidth
                label="Email"
                type="email"
                autoFocus
                value={formData.email}
                onChange={handleInputChange('email')}
                onBlur={() => setEmailTouched(true)}
                autoComplete="username"
                required
                error={emailError}
                helperText={emailError ? 'Ingresa un email válido' : ' '}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email className="text-medium-gray" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                onBlur={() => setPasswordTouched(true)}
                autoComplete="current-password"
                required
                error={passwordError}
                helperText={passwordError ? 'La contraseña debe tener al menos 6 caracteres' : ' '}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock className="text-medium-gray" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {needs2FA && (
                <TextField
                  fullWidth
                  label="Código 2FA"
                  value={totpCode}
                  onChange={e => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  autoFocus
                  placeholder="000000"
                  inputProps={{ maxLength: 6, inputMode: 'numeric', style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.3rem', fontWeight: 700 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Security className="text-medium-gray" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Ingresa el código de tu app de autenticación"
                />
              )}

              <Box className="flex items-center justify-between">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.rememberMe}
                      onChange={handleInputChange('rememberMe')}
                      color="primary"
                    />
                  }
                  label="Recordarme"
                />
                {/* <Link
                  component="button"
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-brand-primary hover:text-brand-secondary"
                >
                  ¿Olvidaste tu contraseña?
                </Link> */}
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !isFormValid}
                className="mt-6 bg-brand-primary hover:bg-brand-secondary"
              >
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}