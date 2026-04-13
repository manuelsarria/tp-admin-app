'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock, Security, ArrowForward } from '@mui/icons-material'
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

  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailError = emailTouched && !emailRegex.test(formData.email)
  const passwordError = passwordTouched && formData.password.length < 6
  const isFormValid = emailRegex.test(formData.email) && formData.password.length >= 6

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
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

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
    } catch {
      setError('Error al iniciar sesión. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      alert('Se ha enviado un enlace de recuperación a tu email')
      setShowResetPassword(false)
      setResetEmail('')
    } catch {
      setError('Error al enviar email de recuperación')
    } finally {
      setIsLoading(false)
    }
  }

  const cardSx = {
    width: '100%',
    maxWidth: 460,
    background: '#FFFFFF',
    borderRadius: '22px',
    border: '1px solid #E7E5E4',
    boxShadow: '0 24px 64px -16px rgba(10, 10, 10, 0.14)',
    p: { xs: 3.5, sm: 5 },
  }

  if (showResetPassword) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAF9', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Box sx={cardSx}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '1.8rem', fontWeight: 600, color: '#0A0A0A', letterSpacing: '-0.02em', mb: 1 }}>
              Recuperar contraseña
            </Typography>
            <Typography sx={{ color: '#78716C', fontSize: '0.9rem' }}>
              Ingresa tu email y te enviaremos un enlace de recuperación.
            </Typography>
          </Box>

          <form onSubmit={handleResetPassword}>
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
                    <Email sx={{ color: '#A8A29E', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 1.5, py: 1.5 }}
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => setShowResetPassword(false)}
              sx={{ mt: 1, color: '#78716C' }}
            >
              Volver al login
            </Button>
          </form>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#FAFAF9' }}>
      {/* Left visual panel */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexBasis: { lg: '58%', xl: '62%' },
          position: 'relative',
          overflow: 'hidden',
          background: `
            radial-gradient(ellipse at 20% 10%, rgba(250,204,21,0.18), transparent 55%),
            radial-gradient(ellipse at 80% 90%, rgba(250,204,21,0.10), transparent 50%),
            #0A0A0A
          `,
          color: '#FFFFFF',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 7,
        }}
      >
        {/* Grid overlay */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 75%)',
          pointerEvents: 'none',
        }} />

        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            background: '#FFFFFF',
            borderRadius: '14px',
            p: 1.2,
            display: 'inline-flex',
          }}>
            <Image
              src="/images/TP-Logo.png"
              alt="TP Logistics"
              width={140}
              height={36}
              priority
              style={{ height: 'auto', display: 'block' }}
            />
          </Box>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 2, maxWidth: 560 }}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.2,
            px: 1.8,
            py: 0.8,
            border: '1px solid rgba(250,204,21,0.3)',
            background: 'rgba(250,204,21,0.08)',
            borderRadius: '999px',
            mb: 3.5,
          }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FACC15',
              boxShadow: '0 0 0 4px rgba(250,204,21,0.2)',
            }} />
            <Typography sx={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#FACC15',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Panel interno · Operaciones
            </Typography>
          </Box>
          <Typography sx={{
            fontFamily: '"Space Grotesk", "Inter", sans-serif',
            fontSize: { lg: '3.2rem', xl: '3.8rem' },
            fontWeight: 600,
            color: '#FFFFFF',
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            mb: 2.5,
          }}>
            Logística global,<br />
            <Box component="span" sx={{ color: '#FACC15' }}>sin fronteras</Box>.
          </Typography>
          <Typography sx={{
            fontSize: '1.02rem',
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.68)',
            maxWidth: '44ch',
          }}>
            Cotizaciones, bookings, etiquetas, rastreo y contabilidad en un solo lugar.
            Un equipo panameño detrás de cada movimiento.
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', gap: 4, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
          <Typography variant="caption" sx={{ color: 'inherit' }}>© {new Date().getFullYear()} TP Logistics</Typography>
          <Typography variant="caption" sx={{ color: 'inherit' }}>Miami · Guangzhou · Panamá</Typography>
        </Box>
      </Box>

      {/* Right form panel */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, sm: 5 },
      }}>
        <Box sx={cardSx}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, justifyContent: 'center', mb: 3 }}>
            <Image
              src="/images/TP-Logo.png"
              alt="TP Logistics"
              width={140}
              height={36}
              priority
              style={{ height: 'auto' }}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#A8A29E',
              mb: 1,
            }}>
              Bienvenido de vuelta
            </Typography>
            <Typography sx={{
              fontFamily: '"Space Grotesk", "Inter", sans-serif',
              fontSize: '2rem',
              fontWeight: 600,
              color: '#0A0A0A',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              mb: 1,
            }}>
              Inicia sesión
            </Typography>
            <Typography sx={{ color: '#78716C', fontSize: '0.92rem' }}>
              Accede a tu cuenta para operar.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
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
                    <Email sx={{ color: '#A8A29E', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 0.5 }}
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
              helperText={passwordError ? 'Mínimo 6 caracteres' : ' '}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#A8A29E', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      sx={{ color: '#A8A29E' }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 0.5 }}
            />

            {needs2FA && (
              <TextField
                fullWidth
                label="Código 2FA"
                value={totpCode}
                onChange={e => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                autoFocus
                placeholder="000000"
                inputProps={{
                  maxLength: 6,
                  inputMode: 'numeric',
                  style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.3rem', fontWeight: 700 },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Security sx={{ color: '#A8A29E', fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
                helperText="Ingresa el código de tu app de autenticación"
                sx={{ mt: 1 }}
              />
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 2.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rememberMe}
                    onChange={handleInputChange('rememberMe')}
                    sx={{
                      color: '#D6D3D1',
                      '&.Mui-checked': { color: '#0A0A0A' },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem', color: '#57534E' }}>Recordarme</Typography>}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading || !isFormValid}
              endIcon={!isLoading ? <ArrowForward /> : undefined}
              sx={{
                py: 1.6,
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              {isLoading ? <CircularProgress size={22} sx={{ color: '#0A0A0A' }} /> : 'Iniciar sesión'}
            </Button>
          </form>

          <Typography sx={{
            textAlign: 'center',
            mt: 3.5,
            fontSize: '0.74rem',
            color: '#A8A29E',
          }}>
            © {new Date().getFullYear()} TP Logistics · app.tplogist.com
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
