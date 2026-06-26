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
  ManageAccounts,
  Person,
  Business,
  Security,
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
  AccountBalanceWallet,
  TrendingUp,
  ReceiptLong,
  Email,
  EventAvailable,
  ViewKanban,
  Schedule,
  Paid,
  Leaderboard,
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

const DRAWER_WIDTH = 272

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

interface MenuSection {
  id: string
  label: string
  items: MenuItemData[]
}

// Menu grouped into visual sections — a clear break from CNC's flat list.
const menuSections: MenuSection[] = [
  {
    id: 'general',
    label: 'General',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <Dashboard />,
        path: '/dashboard',
        roles: ['ADMIN', 'WORKER', 'BUSINESS_USER', 'CUSTOMER_USER', 'MBE_MANAGER'],
        exact: true,
      },
    ],
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    items: [
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
        roles: ['ADMIN', 'BUSINESS_USER', 'WORKER', 'CUSTOMER_USER', 'MBE_MANAGER'],
      },
      {
        id: 'gestion-contenedor',
        label: 'Gestión Contenedor',
        icon: <DirectionsBoat />,
        path: '/dashboard/gestion-contenedor',
        roles: ['ADMIN', 'WORKER'],
      },
      {
        id: 'rastreo',
        label: 'Rastreo de Paquete',
        icon: <LocalShipping />,
        path: '/dashboard/rastreo',
        roles: ['ADMIN', 'WORKER', 'BUSINESS_USER', 'CUSTOMER_USER'],
      },
      {
        id: 'almacenes',
        label: 'Almacenes / Citas',
        icon: <EventAvailable />,
        path: '/dashboard/almacenes',
        roles: ['ADMIN', 'WORKER'],
      },
    ],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    items: [
      {
        id: 'ventas-comisiones',
        label: 'Ventas y Comisiones',
        icon: <Paid />,
        path: '/dashboard/ventas',
        roles: ['ADMIN', 'WORKER'],
      },
    ],
  },
  {
    id: 'productividad',
    label: 'Productividad',
    items: [
      {
        id: 'tablero',
        label: 'Tablero de Tareas',
        icon: <ViewKanban />,
        path: '/dashboard/tablero',
        roles: ['ADMIN', 'WORKER'],
      },
      {
        id: 'asistencia',
        label: 'Asistencia',
        icon: <Schedule />,
        path: '/dashboard/asistencia',
        roles: ['ADMIN', 'WORKER'],
      },
      {
        id: 'leaderboard',
        label: 'Rendimiento (Pantalla)',
        icon: <Leaderboard />,
        path: '/pantalla',
        roles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'freight',
    label: 'Freight Forwarding',
    items: [
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
    ],
  },
  {
    id: 'cotizaciones',
    label: 'Cotizaciones',
    items: [
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
    ],
  },
  {
    id: 'recursos',
    label: 'Recursos',
    items: [
      {
        id: 'proveedores',
        label: 'Proveedores',
        icon: <Contacts />,
        path: '/dashboard/proveedores',
        roles: ['ADMIN', 'BUSINESS_USER', 'CUSTOMER_USER'],
      },
      {
        id: 'checklist-importacion',
        label: 'Checklist Importación',
        icon: <AssignmentTurnedIn />,
        path: '/dashboard/checklist-importacion',
        roles: ['ADMIN', 'BUSINESS_USER', 'CUSTOMER_USER'],
      },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    items: [
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
        id: 'finanzas-personales',
        label: 'Finanzas Personales',
        icon: <AccountBalanceWallet />,
        path: '/dashboard/finanzas',
        roles: ['ADMIN'],
        emailOnly: ['manuell.sarria@gmail.com', 'andrea.munoz@gmail.com'],
      },
    ],
  },
  {
    id: 'cuenta',
    label: 'Cuenta',
    items: [
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
            icon: <ManageAccounts />,
            path: '/dashboard/mi-cuenta/empresas',
            roles: ['ADMIN'],
          },
        ],
      },
    ],
  },
]

const ACTIVE_BG = '#FEF3C7'
const ACTIVE_TEXT = '#0A0A0A'
const DEFAULT_TEXT = '#57534E'
const HOVER_BG = '#F5F5F4'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
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

  const isItemVisible = (item: MenuItemData) =>
    item.roles.includes(userRole) &&
    (!item.emailOnly ||
      (Array.isArray(item.emailOnly) ? item.emailOnly.includes(userEmail) : item.emailOnly === userEmail))

  const isMenuItemActive = (item: MenuItemData): boolean => {
    if (!item.roles.includes(userRole)) return false
    if (item.path) {
      if (item.exact) return pathname === item.path
      return pathname === item.path || pathname.startsWith(`${item.path}/`)
    }
    if (item.children?.length) return item.children.some(isMenuItemActive)
    return false
  }

  const filteredSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(isItemVisible),
    }))
    .filter(section => section.items.length > 0)

  useEffect(() => {
    const expanded: string[] = []
    const walk = (items: MenuItemData[]) => {
      items.forEach(item => {
        if (!item.roles.includes(userRole)) return
        if (item.children?.length) {
          const accessibleChildren = item.children.filter(isItemVisible)
          const anyActive = accessibleChildren.some(child => isMenuItemActive(child))
          if (anyActive) expanded.push(item.id)
          walk(item.children)
        }
      })
    }
    filteredSections.forEach(section => walk(section.items))
    setExpandedItems(expanded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userRole])

  const renderMenuItem = (item: MenuItemData, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const filteredChildren = item.children?.filter(isItemVisible)
    const isExpanded = expandedItems.includes(item.id)
    const isActive = isMenuItemActive(item)

    if (hasChildren) {
      return (
        <div key={item.id}>
          <ListItem disablePadding sx={{ mb: 0.4 }}>
            <ListItemButton
              onClick={() => handleExpandClick(item.id)}
              sx={{
                position: 'relative',
                borderRadius: '999px',
                mx: 1.5,
                pl: 2,
                pr: 1.5,
                py: 0.9,
                minHeight: 42,
                color: isActive ? ACTIVE_TEXT : DEFAULT_TEXT,
                bgcolor: isActive ? ACTIVE_BG : 'transparent',
                transition: 'all 0.18s ease',
                '&:hover': {
                  bgcolor: isActive ? ACTIVE_BG : HOVER_BG,
                  color: ACTIVE_TEXT,
                },
              }}
            >
              <ListItemIcon sx={{
                color: isActive ? '#0A0A0A' : '#78716C',
                minWidth: 32,
                '& .MuiSvgIcon-root': { fontSize: '1.15rem' },
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '-0.005em',
                  color: 'inherit',
                }}
              />
              {isExpanded ? (
                <ExpandLess sx={{ color: isActive ? '#0A0A0A' : '#A8A29E', fontSize: '1.1rem' }} />
              ) : (
                <ExpandMore sx={{ color: '#A8A29E', fontSize: '1.1rem' }} />
              )}
            </ListItemButton>
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{
              pl: 4,
              ml: 3.5,
              borderLeft: '1px dashed #E7E5E4',
              mt: 0.2,
              mb: 0.4,
            }}>
              {filteredChildren?.map(child => renderMenuItem(child, level + 1))}
            </Box>
          </Collapse>
        </div>
      )
    }

    // Leaf item
    if (level > 0) {
      // Child nav item — smaller, no icon background
      return (
        <ListItem key={item.id} disablePadding sx={{ mb: 0.2 }}>
          <ListItemButton
            onClick={() => {
              if (item.path) router.push(item.path)
              if (mobileOpen) setMobileOpen(false)
            }}
            sx={{
              position: 'relative',
              borderRadius: '999px',
              mr: 1.5,
              pl: 1.5,
              pr: 1.5,
              py: 0.6,
              minHeight: 34,
              color: isActive ? ACTIVE_TEXT : DEFAULT_TEXT,
              bgcolor: isActive ? ACTIVE_BG : 'transparent',
              transition: 'all 0.18s ease',
              '&:hover': {
                bgcolor: isActive ? ACTIVE_BG : HOVER_BG,
                color: ACTIVE_TEXT,
              },
            }}
          >
            <Box sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: isActive ? '#FACC15' : '#D6D3D1',
              mr: 1.5,
              flexShrink: 0,
              transition: 'background 0.18s ease',
            }} />
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.8rem',
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '-0.005em',
                color: 'inherit',
              }}
            />
          </ListItemButton>
        </ListItem>
      )
    }

    // Top-level leaf item
    return (
      <ListItem key={item.id} disablePadding sx={{ mb: 0.4 }}>
        <ListItemButton
          onClick={() => {
            if (item.path) router.push(item.path)
            if (mobileOpen) setMobileOpen(false)
          }}
          sx={{
            position: 'relative',
            borderRadius: '999px',
            mx: 1.5,
            pl: 2,
            pr: 1.5,
            py: 0.9,
            minHeight: 42,
            color: isActive ? ACTIVE_TEXT : DEFAULT_TEXT,
            bgcolor: isActive ? ACTIVE_BG : 'transparent',
            transition: 'all 0.18s ease',
            '&:hover': {
              bgcolor: isActive ? ACTIVE_BG : HOVER_BG,
              color: ACTIVE_TEXT,
            },
          }}
        >
          <ListItemIcon sx={{
            color: isActive ? '#0A0A0A' : '#78716C',
            minWidth: 32,
            '& .MuiSvgIcon-root': { fontSize: '1.15rem' },
          }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.86rem',
              fontWeight: isActive ? 600 : 500,
              letterSpacing: '-0.005em',
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
      background: '#FFFFFF',
      borderRight: '1px solid #E7E5E4',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo header */}
      <Box sx={{
        px: 3,
        py: 2.5,
        borderBottom: '1px solid #F5F5F4',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        transition: 'background 0.18s',
        '&:hover': { background: '#FAFAF9' },
      }}
        onClick={() => router.push('/dashboard')}
      >
        <Image
          src="/images/TP-Logo.png"
          alt="TP Logistics"
          width={140}
          height={36}
          priority
          style={{ height: 'auto' }}
        />
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1.5 }}>
        {filteredSections.map((section, idx) => (
          <Box key={section.id} sx={{ mb: idx === filteredSections.length - 1 ? 0 : 1.5 }}>
            <Typography
              sx={{
                fontSize: '0.64rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#A8A29E',
                px: 3.5,
                mb: 0.8,
                mt: idx === 0 ? 0 : 1,
              }}
            >
              {section.label}
            </Typography>
            <List sx={{ p: 0 }}>
              {section.items.map(item => renderMenuItem(item))}
            </List>
          </Box>
        ))}
      </Box>

      {/* User card + logout */}
      <Box sx={{
        p: 2,
        borderTop: '1px solid #F5F5F4',
        background: '#FAFAF9',
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.3,
          p: 1.3,
          borderRadius: '14px',
          background: '#FFFFFF',
          border: '1px solid #E7E5E4',
          cursor: 'pointer',
          transition: 'all 0.18s',
          '&:hover': {
            borderColor: '#0A0A0A',
          },
        }}
          onClick={() => router.push('/dashboard/mi-cuenta/perfil')}
        >
          <Avatar sx={{
            background: '#FACC15',
            color: '#0A0A0A',
            width: 38,
            height: 38,
            fontSize: '0.9rem',
            fontWeight: 700,
          }}>
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontWeight: 600,
              color: '#0A0A0A',
              fontSize: '0.82rem',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {userName}
            </Typography>
            <Typography sx={{
              color: '#78716C',
              fontSize: '0.7rem',
              fontWeight: 500,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {roleLabels[userRole] || userRole}
            </Typography>
          </Box>
        </Box>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            mt: 1,
            borderRadius: '999px',
            color: '#78716C',
            py: 0.8,
            px: 1.5,
            transition: 'all 0.18s',
            '&:hover': {
              bgcolor: '#FEF2F2',
              color: '#B91C1C',
              '& .MuiListItemIcon-root': { color: '#B91C1C' },
            },
          }}
        >
          <ListItemIcon sx={{
            color: '#78716C',
            minWidth: 30,
            transition: 'color 0.18s',
            '& .MuiSvgIcon-root': { fontSize: '1.05rem' },
          }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar sesión"
            primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 500, color: 'inherit' }}
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  const pageTitle = (() => {
    const map: [string, string][] = [
      ['/dashboard/carga', 'Gestión de Carga'],
      ['/dashboard/admin-carga', 'Administración de Carga'],
      ['/dashboard/gestion-contenedor', 'Gestión Contenedor'],
      ['/dashboard/contenedor', 'Gestión de Contenedores'],
      ['/dashboard/cotizaciones/nueva-quote', 'Nueva Cotización Logística'],
      ['/dashboard/cotizaciones/nueva-fast-quote', 'Nueva Fast Quote'],
      ['/dashboard/cotizaciones/fast-quotes', 'Fast Quotes'],
      ['/dashboard/cotizaciones/extra-manejos', 'Extra Manejos'],
      ['/dashboard/cotizaciones/quotes', 'Quotes en Progreso'],
      ['/dashboard/cotizaciones/seguro-carga', 'Cotizador de Seguro de Carga'],
      ['/dashboard/cotizaciones/aduanas', 'Cotizador de Honorarios Aduaneros'],
      ['/dashboard/mis-cotizaciones', 'Mis Cotizaciones'],
      ['/dashboard/etiquetas-cr', 'Generador de Etiquetas CR'],
      ['/dashboard/etiquetas', 'Generador de Etiquetas PA'],
      ['/dashboard/proveedores', 'Directorio de Proveedores'],
      ['/dashboard/checklist-importacion', 'Checklist de Importación'],
      ['/dashboard/freight/bodega', 'Bodega'],
      ['/dashboard/freight/lcl/bookings', 'LCL — Bookings / HBL'],
      ['/dashboard/freight/lcl/containers', 'LCL — Contenedores'],
      ['/dashboard/freight/boletin', 'Boletín Semanal'],
      ['/dashboard/rastreo', 'Rastreo de Paquete'],
      ['/dashboard/almacenes', 'Almacenes — Gestión de Citas'],
      ['/dashboard/ventas', 'Ventas y Comisiones'],
      ['/dashboard/tablero', 'Tablero de Tareas'],
      ['/dashboard/asistencia', 'Reporte de Entrada y Salida'],
      ['/dashboard/contabilidad/operaciones', 'Operaciones'],
      ['/dashboard/contabilidad/transacciones', 'Transacciones'],
      ['/dashboard/contabilidad', 'Dashboard Financiero'],
      ['/dashboard/mi-cuenta', 'Mi Cuenta'],
      ['/dashboard', 'Dashboard'],
    ]
    for (const [prefix, title] of map) {
      if (pathname === prefix || pathname.startsWith(prefix + '/')) return title
    }
    return 'Dashboard'
  })()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#FAFAF9' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'saturate(180%) blur(14px)',
          WebkitBackdropFilter: 'saturate(180%) blur(14px)',
          color: '#0A0A0A',
          boxShadow: 'none',
          borderBottom: '1px solid #E7E5E4',
        }}
      >
        <Toolbar sx={{ py: 0.5, minHeight: { xs: 58, sm: 68 } }}>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1.5, display: { md: 'none' }, color: '#292524' }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
            <Typography sx={{
              fontFamily: '"Space Grotesk", "Inter", sans-serif',
              fontSize: { xs: '1rem', sm: '1.2rem' },
              fontWeight: 600,
              color: '#0A0A0A',
              letterSpacing: '-0.02em',
            }}>
              {pageTitle}
            </Typography>
            <Typography sx={{
              display: { xs: 'none', md: 'inline' },
              fontSize: '0.72rem',
              fontWeight: 500,
              color: '#A8A29E',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              · TP Logistics
            </Typography>
          </Box>

          {/* Dev role switcher */}
          {isDev && (
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, mr: 1.5 }}>
              <Tooltip title="Cambiar rol (solo dev)">
                <SwapHoriz sx={{ fontSize: 16, color: '#78716C' }} />
              </Tooltip>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select
                  value={userRole}
                  onChange={(e) => handleRoleSwitch(e.target.value)}
                  variant="outlined"
                  sx={{
                    height: 32,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '999px',
                    color: '#0A0A0A',
                    bgcolor: roleOverride ? '#FEF3C7' : '#F5F5F4',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: roleOverride ? '#FACC15' : '#E7E5E4',
                    },
                    '& .MuiSelect-select': { py: 0.5, px: 1.8 },
                    '& .MuiSelect-icon': { color: '#78716C' },
                  }}
                >
                  <MenuItem value="ADMIN" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>ADMIN</MenuItem>
                  <MenuItem value="WORKER" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>WORKER</MenuItem>
                  <MenuItem value="BUSINESS_USER" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>BUSINESS</MenuItem>
                  <MenuItem value="CUSTOMER_USER" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>CUSTOMER</MenuItem>
                  <MenuItem value="MBE_MANAGER" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>MBE MGR</MenuItem>
                </Select>
              </FormControl>
              {roleOverride && (
                <Chip
                  label="DEV"
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 800,
                    fontSize: '0.6rem',
                    bgcolor: '#0A0A0A',
                    color: '#FACC15',
                  }}
                />
              )}
            </Box>
          )}

          <IconButton
            size="small"
            aria-label="account"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
          >
            <Avatar sx={{
              background: '#FACC15',
              color: '#0A0A0A',
              width: 36,
              height: 36,
              fontSize: '0.86rem',
              fontWeight: 700,
              border: '1px solid #EAB308',
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
                borderRadius: '14px',
                border: '1px solid #E7E5E4',
                bgcolor: '#FFFFFF',
                boxShadow: '0 18px 40px -12px rgba(10, 10, 10, 0.18)',
                mt: 1,
                minWidth: 210,
              },
            }}
          >
            <MenuItem
              onClick={() => { handleClose(); router.push('/dashboard/mi-cuenta/perfil') }}
              sx={{ py: 1.3, color: '#292524', '&:hover': { bgcolor: '#FAFAF9' } }}
            >
              <AccountCircle sx={{ mr: 2, color: '#78716C' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Mi perfil</Typography>
            </MenuItem>
            <MenuItem
              onClick={handleClose}
              sx={{ py: 1.3, color: '#292524', '&:hover': { bgcolor: '#FAFAF9' } }}
            >
              <Settings sx={{ mr: 2, color: '#78716C' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Configuración</Typography>
            </MenuItem>
            <Divider sx={{ borderColor: '#F5F5F4', my: 0.4 }} />
            <MenuItem
              onClick={handleLogout}
              sx={{ py: 1.3, color: '#B91C1C', '&:hover': { bgcolor: '#FEF2F2' } }}
            >
              <Logout sx={{ mr: 2, color: 'inherit' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Cerrar sesión</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
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
              bgcolor: '#FFFFFF',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
              bgcolor: '#FFFFFF',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.8, sm: 2.4, md: 3.2 },
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          overflow: 'hidden',
          bgcolor: '#FAFAF9',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 58, sm: 68 } }} />
        {children}
      </Box>

      <LoginSuccessPopup open={showPopup} onClose={closePopup} />
    </Box>
  )
}
