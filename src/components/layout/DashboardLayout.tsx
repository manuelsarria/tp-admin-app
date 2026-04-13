'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Badge,
  Chip,
  Select,
  FormControl,
  Tooltip,
} from '@mui/material'
import { SwapHoriz } from '@mui/icons-material'
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  ExpandLess,
  ExpandMore,
  Dashboard,
  LocalShipping,
  Inventory,
  ManageAccounts,
  Person,
  Business,
  Security,
  Notifications,
  Settings,
  DirectionsBoat,
  RequestQuote,
  Policy,
  Gavel,
  Add,
  FolderOpen,
  FlashOn,
  BoltOutlined,
  Warehouse,
  Description,
  ViewInAr,
  Contacts,
  AssignmentTurnedIn,
  Label,
  AccountBalance,
  TrendingUp,
  ReceiptLong,
  Email,
  EventAvailable,
} from '@mui/icons-material'
import { UserRole } from '@/types'
import { LoginSuccessPopup } from '@/components/ui/LoginSuccessPopup'
import { useLoginSuccessPopup } from '@/hooks/useLoginSuccessPopup'

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  WORKER: 'Trabajador',
  BUSINESS_USER: 'Usuario de Empresa',
  CUSTOMER_USER: 'Usuario Cliente',
  MBE_MANAGER: 'Gerencia MBE',
}

const DRAWER_WIDTH = 260
const ITEM_RADIUS = 10
const CHILD_RADIUS = 8

interface MenuItemData {
  id: string
  label: string
  icon: React.ReactNode
  path?: string
  roles: UserRole[]
  children?: MenuItemData[]
  exact?: boolean
  emailOnly?: string | string[]
}

const menuItems: MenuItemData[] = [
  {
    id: 'general',
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    roles: ['ADMIN', 'WORKER', 'BUSINESS_USER', 'CUSTOMER_USER', 'MBE_MANAGER'],
    exact: true,
  },
  {
    id: 'carga',
    label: 'Carga',
    icon: <LocalShipping />,
    path: '/dashboard/carga',
    roles: ['ADMIN', 'BUSINESS_USER', 'WORKER', 'CUSTOMER_USER', 'MBE_MANAGER'],
  },
  {
    id: 'ADMIN-carga',
    label: 'Admin Carga',
    icon: <Settings />,
    path: '/dashboard/admin-carga',
    roles: ['ADMIN','BUSINESS_USER', 'WORKER','CUSTOMER_USER', 'MBE_MANAGER'],
  },
  {
    id: 'gestion-contenedor',
    label: 'Gestión Contenedor',
    icon: <DirectionsBoat />,
    path: '/dashboard/gestion-contenedor',
    roles: ['ADMIN', 'WORKER'],
  },
  {
    id: 'etiquetas',
    label: 'Etiquetas PA',
    icon: <Label />,
    path: '/dashboard/etiquetas',
    roles: ['ADMIN'],
  },
  {
    id: 'etiquetas-cr',
    label: 'Etiquetas CR',
    icon: <Label />,
    path: '/dashboard/etiquetas-cr',
    roles: ['ADMIN'],
  },
  {
    id: 'almacenes',
    label: 'Almacenes / Citas',
    icon: <EventAvailable />,
    path: '/dashboard/almacenes',
    roles: ['ADMIN', 'WORKER'],
  },
  {
    id: 'cotizaciones',
    label: 'Cotizaciones',
    icon: <RequestQuote />,
    roles: ['ADMIN'],
    children: [
      {
        id: 'nueva-quote',
        label: 'Nueva Cotización',
        icon: <Add />,
        path: '/dashboard/cotizaciones/nueva-quote',
        roles: ['ADMIN'],
      },
      {
        id: 'quotes-progreso',
        label: 'Quotes en Progreso',
        icon: <FolderOpen />,
        path: '/dashboard/cotizaciones/quotes',
        roles: ['ADMIN'],
      },
      {
        id: 'nueva-fast-quote',
        label: 'Nueva Fast Quote',
        icon: <FlashOn />,
        path: '/dashboard/cotizaciones/nueva-fast-quote',
        roles: ['ADMIN'],
      },
      {
        id: 'fast-quotes',
        label: 'Fast Quotes',
        icon: <BoltOutlined />,
        path: '/dashboard/cotizaciones/fast-quotes',
        roles: ['ADMIN'],
      },
      {
        id: 'seguro-carga',
        label: 'Seguro de Carga',
        icon: <Policy />,
        path: '/dashboard/cotizaciones/seguro-carga',
        roles: ['ADMIN'],
      },
      {
        id: 'aduanas',
        label: 'Honorarios Aduaneros',
        icon: <Gavel />,
        path: '/dashboard/cotizaciones/aduanas',
        roles: ['ADMIN'],
      },
      {
        id: 'extra-manejos',
        label: 'Extra Manejos',
        icon: <ReceiptLong />,
        path: '/dashboard/cotizaciones/extra-manejos',
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'mis-cotizaciones',
    label: 'Mis Cotizaciones',
    icon: <RequestQuote />,
    path: '/dashboard/mis-cotizaciones',
    roles: ['BUSINESS_USER', 'CUSTOMER_USER'],
  },
  {
    id: 'freight',
    label: 'Freight Forwarder',
    icon: <LocalShipping />,
    roles: ['ADMIN', 'WORKER'],
    children: [
      {
        id: 'bodega',
        label: 'Bodega',
        icon: <Warehouse />,
        path: '/dashboard/freight/bodega',
        roles: ['ADMIN', 'WORKER'],
      },
      {
        id: 'lcl-bookings',
        label: 'Bookings / HBL',
        icon: <Description />,
        path: '/dashboard/freight/lcl/bookings',
        roles: ['ADMIN', 'WORKER'],
      },
      {
        id: 'lcl-containers',
        label: 'Contenedores LCL',
        icon: <ViewInAr />,
        path: '/dashboard/freight/lcl/containers',
        roles: ['ADMIN', 'WORKER'],
      },
      {
        id: 'boletin',
        label: 'Boletín Semanal',
        icon: <Email />,
        path: '/dashboard/freight/boletin',
        roles: ['ADMIN', 'WORKER'],
      },
    ],
  },
  {
    id: 'rastreo',
    label: 'Rastreo de Paquete',
    icon: <LocalShipping />,
    path: '/dashboard/rastreo',
    roles: ['ADMIN', 'WORKER', 'BUSINESS_USER', 'CUSTOMER_USER'],
  },
  {
    id: 'proveedores',
    label: 'Proveedores',
    icon: <Contacts />,
    path: '/dashboard/proveedores',
    roles: ['ADMIN', 'BUSINESS_USER', 'CUSTOMER_USER'],
  },
  {
    id: 'checklist-importacion',
    label: 'Checklist Importacion',
    icon: <AssignmentTurnedIn />,
    path: '/dashboard/checklist-importacion',
    roles: ['ADMIN', 'BUSINESS_USER', 'CUSTOMER_USER'],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    icon: <AccountBalance />,
    roles: ['ADMIN'],
    emailOnly: ['manuell.sarria@gmail.com', 'krlos@cyber.pty'],
    children: [
      {
        id: 'contabilidad-dashboard',
        label: 'Dashboard Financiero',
        icon: <TrendingUp />,
        path: '/dashboard/contabilidad',
        roles: ['ADMIN'],
        exact: true,
        emailOnly: ['manuell.sarria@gmail.com', 'krlos@cyber.pty'],
      },
      {
        id: 'contabilidad-operaciones',
        label: 'Operaciones',
        icon: <LocalShipping />,
        path: '/dashboard/contabilidad/operaciones',
        roles: ['ADMIN'],
        emailOnly: ['manuell.sarria@gmail.com', 'krlos@cyber.pty'],
      },
      {
        id: 'contabilidad-transacciones',
        label: 'Transacciones',
        icon: <ReceiptLong />,
        path: '/dashboard/contabilidad/transacciones',
        roles: ['ADMIN'],
        emailOnly: ['manuell.sarria@gmail.com', 'krlos@cyber.pty'],
      },
    ],
  },
  {
    id: 'mi-cuenta',
    label: 'Mi Cuenta',
    icon: <Person />,
    roles: ['ADMIN', 'WORKER', 'BUSINESS_USER', 'CUSTOMER_USER', 'MBE_MANAGER'],
    children: [
      {
        id: 'perfil-cuenta',
        label: 'Perfil de la cuenta',
        icon: <Person />,
        path: '/dashboard/mi-cuenta/perfil',
        roles: ['ADMIN', 'WORKER', 'BUSINESS_USER', 'CUSTOMER_USER', 'MBE_MANAGER'],
      },
      {
        id: 'perfil-empresa',
        label: 'Perfil de Empresa',
        icon: <Business />,
        path: '/dashboard/mi-cuenta/empresa',
        roles: ['ADMIN', 'BUSINESS_USER'],
      },
      {
        id: 'permisos-usuarios',
        label: 'Permisos de usuarios',
        icon: <Security />,
        path: '/dashboard/mi-cuenta/permisos',
        roles: ['ADMIN'],
      },
      {
        id: 'empresas',
        label: 'Empresas',
        icon: <Security />,
        path: '/dashboard/mi-cuenta/empresas',
        roles: ['ADMIN'],
      },
    ],
  },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { showPopup, closePopup } = useLoginSuccessPopup()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const userName = session?.user?.name || 'Usuario'
  const realRole = (session?.user?.role as UserRole) || 'BUSINESS_USER'

  const DEV_EMAIL = 'manuell.sarria@gmail.com'
  const isDev = session?.user?.email === DEV_EMAIL
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null)

  useEffect(() => {
    if (isDev) {
      const saved = localStorage.getItem('dev-role-override') as UserRole | null
      if (saved && saved !== realRole) setRoleOverride(saved)
    }
  }, [isDev, realRole])

  const userRole = (isDev && roleOverride) ? roleOverride : realRole

  const handleRoleSwitch = (newRole: string) => {
    const role = newRole as UserRole
    if (role === realRole) {
      setRoleOverride(null)
      localStorage.removeItem('dev-role-override')
    } else {
      setRoleOverride(role)
      localStorage.setItem('dev-role-override', role)
    }
    router.refresh()
  }

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const handleLogout = async () => {
    localStorage.removeItem('show-welcome-popup')
    localStorage.removeItem('login-success-popup-shown')
    await signOut({ redirect: false })
    router.push('/')
  }

  const handleExpandClick = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const userEmail = session?.user?.email || ''
  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(userRole) &&
    (!item.emailOnly || (Array.isArray(item.emailOnly) ? item.emailOnly.includes(userEmail) : item.emailOnly === userEmail))
  )

  const isMenuItemActive = (item: MenuItemData): boolean => {
    if (!item.roles.includes(userRole)) return false
    if (item.path) {
      if (item.exact) return pathname === item.path
      return pathname === item.path || pathname.startsWith(`${item.path}/`)
    }
    if (item.children?.length) return item.children.some(isMenuItemActive)
    return false
  }

  useEffect(() => {
    const expanded: string[] = []
    const walk = (items: MenuItemData[]) => {
      items.forEach(item => {
        if (!item.roles.includes(userRole)) return
        if (item.children?.length) {
          const accessibleChildren = item.children.filter(child => child.roles.includes(userRole) && (!child.emailOnly || (Array.isArray(child.emailOnly) ? child.emailOnly.includes(userEmail) : child.emailOnly === userEmail)))
          const anyActive = accessibleChildren.some(child => isMenuItemActive(child))
          if (anyActive) expanded.push(item.id)
          walk(item.children)
        }
      })
    }
    walk(menuItems)
    setExpandedItems(expanded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userRole])

  const renderMenuItem = (item: MenuItemData, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const filteredChildren = item.children?.filter(child =>
      child.roles.includes(userRole) &&
      (!child.emailOnly || (Array.isArray(child.emailOnly) ? child.emailOnly.includes(userEmail) : child.emailOnly === userEmail))
    )
    const isExpanded = expandedItems.includes(item.id)
    const isActive = isMenuItemActive(item)

    if (hasChildren) {
      return (
        <div key={item.id}>
          <ListItem disablePadding sx={{ mb: 0.3 }}>
            <ListItemButton
              onClick={() => handleExpandClick(item.id)}
              sx={{
                position: 'relative',
                borderRadius: `${ITEM_RADIUS}px`,
                mx: 1.5,
                color: isActive ? '#F1F5F9' : '#64748B',
                py: 0.8,
                px: 1.5,
                minHeight: 38,
                bgcolor: isActive ? 'rgba(227, 6, 19, 0.12)' : 'transparent',
                borderLeft: `3px solid ${isActive ? '#FACC15' : 'transparent'}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(148, 163, 184, 0.08)',
                  color: '#F1F5F9',
                },
              }}
            >
              {level === 0 && (
                <ListItemIcon sx={{
                  color: isActive ? '#FACC15' : 'inherit',
                  minWidth: 36,
                  '& .MuiSvgIcon-root': { fontSize: '1.1rem' }
                }}>
                  {item.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '-0.01em',
                  color: 'inherit',
                }}
              />
              {isExpanded ? (
                <ExpandLess sx={{ color: isActive ? '#FACC15' : '#64748B', fontSize: '1rem' }} />
              ) : (
                <ExpandMore sx={{ color: '#64748B', fontSize: '1rem' }} />
              )}
            </ListItemButton>
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 1 }}>
              {filteredChildren?.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        </div>
      )
    }

    return (
      <ListItem key={item.id} disablePadding sx={{ mb: 0.3 }}>
        <ListItemButton
          onClick={() => {
            if (item.path) router.push(item.path)
            // Close mobile drawer on navigation
            if (mobileOpen) setMobileOpen(false)
          }}
          sx={{
            position: 'relative',
            borderRadius: level === 0 ? `${ITEM_RADIUS}px` : `${CHILD_RADIUS}px`,
            mx: 1.5,
            ml: level > 0 ? 3 : 1.5,
            color: isActive ? '#F1F5F9' : '#64748B',
            bgcolor: isActive ? 'rgba(227, 6, 19, 0.12)' : 'transparent',
            borderLeft: `3px solid ${isActive ? '#FACC15' : 'transparent'}`,
            py: level === 0 ? 1 : 0.6,
            px: 1.25,
            minHeight: 36,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(148, 163, 184, 0.08)',
              color: '#F1F5F9',
            },
            boxShadow: 'none',
          }}
        >
          {level === 0 && (
            <ListItemIcon sx={{
              color: isActive ? '#FACC15' : 'inherit',
              minWidth: 36,
              '& .MuiSvgIcon-root': { fontSize: '1.1rem' }
            }}>
              {item.icon}
            </ListItemIcon>
          )}
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: level === 0 ? '0.85rem' : '0.82rem',
              fontWeight: isActive ? 600 : 500,
              letterSpacing: '-0.01em',
              color: 'inherit',
            }}
          />
        </ListItemButton>
      </ListItem>
    )
  }

  const drawer = (
    <Box sx={{
      height: '100%',
      background: '#0B0F1A',
      borderRight: '1px solid rgba(148, 163, 184, 0.08)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo Section */}
      <Box sx={{
        p: 2.5,
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        cursor: 'pointer',
        transition: 'background 0.2s',
        '&:hover': { background: 'rgba(148, 163, 184, 0.04)' },
      }}
        onClick={() => router.push('/dashboard')}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            src="/images/TP-Logo.png"
            alt="TP Logistics"
            width={160}
            height={42}
            priority
            style={{ height: 'auto', filter: 'brightness(1.1)' }}
          />
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ px: 1, py: 1.5, flex: 1, overflow: 'auto' }}>
        {filteredMenuItems.map(item => renderMenuItem(item))}
      </List>

      {/* User Profile Section */}
      <Box sx={{
        p: 2,
        borderTop: '1px solid rgba(148, 163, 184, 0.06)',
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1.5,
          p: 1.5,
          borderRadius: '10px',
          background: 'rgba(148, 163, 184, 0.05)',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          transition: 'all 0.2s',
          cursor: 'pointer',
          '&:hover': {
            background: 'rgba(148, 163, 184, 0.08)',
            borderColor: 'rgba(148, 163, 184, 0.15)',
          }
        }}
          onClick={() => router.push('/dashboard/mi-cuenta/perfil')}
        >
          <Avatar sx={{
            background: 'linear-gradient(135deg, #FACC15 0%, #C00510 100%)',
            width: 36,
            height: 36,
            mr: 1.5,
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(227, 6, 19, 0.3)',
          }}>
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{
              fontWeight: 600,
              color: '#F1F5F9',
              fontSize: '0.82rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{
              color: '#64748B',
              fontSize: '0.7rem',
              fontWeight: 500,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {roleLabels[userRole] || userRole}
            </Typography>
          </Box>
        </Box>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '10px',
            color: '#64748B',
            py: 1,
            px: 1.5,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#F87171',
              '& .MuiListItemIcon-root': { color: '#F87171' }
            },
          }}
        >
          <ListItemIcon sx={{
            color: '#64748B',
            minWidth: 32,
            transition: 'color 0.2s',
            '& .MuiSvgIcon-root': { fontSize: '1rem' }
          }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar Sesión"
            primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 500, color: 'inherit' }}
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0B0F1A' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(11, 15, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          color: '#F1F5F9',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
        }}
      >
        <Toolbar sx={{ py: 0.5, minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1.5, display: { md: 'none' }, color: '#94A3B8' }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{
            flexGrow: 1,
            fontWeight: 600,
            color: '#F1F5F9',
            fontSize: { xs: '0.9rem', sm: '1.05rem' },
            fontFamily: '"Poppins", sans-serif'
          }}>
            {pathname.includes('/dashboard/carga') && 'Gestión de Carga'}
            {pathname.includes('/dashboard/ADMIN-carga') && 'Administración de Carga'}
            {pathname.includes('/dashboard/contenedor') && 'Gestión de Contenedores'}
            {pathname.includes('/dashboard/gestion-contenedor') && 'Gestión Contenedor'}
            {pathname.includes('/dashboard/cotizaciones/nueva-quote') && 'Nueva Cotización Logística'}
            {pathname.includes('/dashboard/cotizaciones/nueva-fast-quote') && 'Nueva Fast Quote'}
            {pathname.includes('/dashboard/cotizaciones/fast-quotes') && 'Fast Quotes'}
            {pathname.includes('/dashboard/cotizaciones/extra-manejos') && 'Extra Manejos'}
            {pathname.includes('/dashboard/cotizaciones/quotes') && 'Quotes en Progreso'}
            {pathname.includes('/dashboard/cotizaciones/seguro-carga') && 'Cotizador de Seguro de Carga'}
            {pathname.includes('/dashboard/cotizaciones/aduanas') && 'Cotizador de Honorarios Aduaneros'}
            {pathname === '/dashboard/cotizaciones' && 'Cotizaciones'}
            {pathname.includes('/dashboard/mis-cotizaciones') && 'Mis Cotizaciones'}
            {pathname === '/dashboard/etiquetas' && 'Generador de Etiquetas PA'}
            {pathname === '/dashboard/etiquetas-cr' && 'Generador de Etiquetas CR'}
            {pathname.includes('/dashboard/proveedores') && 'Directorio de Proveedores'}
            {pathname.includes('/dashboard/checklist-importacion') && 'Checklist de Importacion'}
            {pathname.includes('/dashboard/mi-cuenta') && 'Mi Cuenta'}
            {pathname === '/dashboard' && 'Dashboard'}
            {pathname.includes('/dashboard/freight/bodega') && 'Bodega'}
            {pathname.includes('/dashboard/freight/lcl/bookings') && 'LCL — Bookings / HBL'}
            {pathname.includes('/dashboard/freight/lcl/containers') && 'LCL — Contenedores'}
            {pathname.includes('/dashboard/freight/boletin') && 'Boletín Semanal'}
            {pathname.includes('/dashboard/rastreo') && 'Rastreo de Paquete'}
            {pathname.includes('/dashboard/almacenes') && 'Almacenes — Gestión de Citas'}
            {pathname.includes('/dashboard/contabilidad') && !pathname.includes('/operaciones') && !pathname.includes('/transacciones') && pathname !== '/dashboard/contabilidad' ? '' : ''}
            {pathname === '/dashboard/contabilidad' && 'Dashboard Financiero'}
            {pathname.includes('/dashboard/contabilidad/operaciones') && 'Operaciones'}
            {pathname.includes('/dashboard/contabilidad/transacciones') && 'Transacciones'}
          </Typography>

          {/* Dev Role Switcher */}
          {isDev && (
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, mr: 1.5 }}>
              <Tooltip title="Cambiar rol (solo dev)">
                <SwapHoriz sx={{ fontSize: 16, color: '#64748B' }} />
              </Tooltip>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select
                  value={userRole}
                  onChange={(e) => handleRoleSwitch(e.target.value)}
                  variant="outlined"
                  sx={{
                    height: 30, fontSize: '0.7rem', fontWeight: 700,
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    bgcolor: roleOverride ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.08)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: roleOverride ? 'rgba(245, 158, 11, 0.3)' : 'rgba(148, 163, 184, 0.15)' },
                    '& .MuiSelect-select': { py: 0.5, px: 1.5 },
                    '& .MuiSelect-icon': { color: '#64748B' },
                  }}
                >
                  <MenuItem value="ADMIN" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>ADMIN</MenuItem>
                  <MenuItem value="WORKER" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>WORKER</MenuItem>
                  <MenuItem value="BUSINESS_USER" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>BUSINESS</MenuItem>
                  <MenuItem value="CUSTOMER_USER" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>CUSTOMER</MenuItem>
                  <MenuItem value="MBE_MANAGER" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>MBE MGR</MenuItem>
                </Select>
              </FormControl>
              {roleOverride && (
                <Chip label="DEV" size="small"
                  sx={{ height: 20, fontWeight: 800, fontSize: '0.58rem', bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' }} />
              )}
            </Box>
          )}

          <IconButton
            size="small"
            aria-label="account"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar sx={{
              background: 'linear-gradient(135deg, #FACC15 0%, #FDE047 100%)',
              width: 34,
              height: 34,
              fontSize: '0.82rem',
              fontWeight: 600
            }}>
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                bgcolor: '#1E293B',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                mt: 1,
                minWidth: 200,
              }
            }}
          >
            <MenuItem
              onClick={() => { handleClose(); router.push('/dashboard/mi-cuenta/perfil') }}
              sx={{ py: 1.5, color: '#CBD5E1', '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.08)', color: '#F1F5F9' } }}
            >
              <AccountCircle sx={{ mr: 2, color: '#64748B' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Mi Perfil</Typography>
            </MenuItem>
            <MenuItem
              onClick={handleClose}
              sx={{ py: 1.5, color: '#CBD5E1', '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.08)', color: '#F1F5F9' } }}
            >
              <Settings sx={{ mr: 2, color: '#64748B' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Configuración</Typography>
            </MenuItem>
            <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.08)', my: 0.5 }} />
            <MenuItem
              onClick={handleLogout}
              sx={{ py: 1.5, color: '#CBD5E1', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#F87171' } }}
            >
              <Logout sx={{ mr: 2, color: 'inherit' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Cerrar Sesión</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
              bgcolor: '#0B0F1A',
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
              bgcolor: '#0B0F1A',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          overflow: 'hidden',
          bgcolor: '#0F1420',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        {children}
      </Box>

      {/* Welcome Popup */}
      <LoginSuccessPopup
        open={showPopup}
        onClose={closePopup}
      />
    </Box>
  )
}
