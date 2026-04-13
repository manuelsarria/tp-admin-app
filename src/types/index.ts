// Re-export Prisma types for consistency
import { User as PrismaUser, Company as PrismaCompany, Cargo as PrismaCargo, Container as PrismaContainer, CargoManagement as PrismaCargoManagement } from '@prisma/client'

export type User = PrismaUser
export type Company = PrismaCompany
export type Cargo = PrismaCargo
export type Container = PrismaContainer
export type CargoManagement = PrismaCargoManagement

// Legacy type mappings for backward compatibility with existing frontend code
export type UserRole = 'ADMIN' | 'WORKER' | 'BUSINESS_USER' | 'CUSTOMER_USER' | 'MBE_MANAGER'

// Frontend-friendly status mappings (Spanish for UI display)
export const mapCargoStatus = (status: PrismaCargo['status']) => {
  const map = {
    IN_TRANSIT: 'En transito',
    ARRIVED_AT_DESTINATION: 'Arribo en destino',
    READY_FOR_DELIVERY: 'Listo para entrega',
    DELIVERED: 'Entregado',
  } as const
  return map[status]
}

export const mapCargoType = (type: PrismaCargo['type']) => {
  const map = {
    MARITIME: 'Marino',
    AIR: 'Aereo',
  } as const
  return map[type]
}

export const mapContainerStatus = (status: PrismaCargoManagement['status']) => {
  const map = {
    RECEIVED_IN_WAREHOUSE: 'Recibido en Bodega',
    IN_TRANSIT: 'En transito',
    ARRIVED_PANAMA: 'Arribo PTY',
    READY_FOR_DELIVERY: 'Listo para Entrega',
  } as const
  return map[status]
}

// Reverse mappings (Spanish to English for API calls)
export const reverseCargoStatus = (status: string) => {
  const map: Record<string, PrismaCargo['status']> = {
    'En transito': 'IN_TRANSIT',
    'Arribo en destino': 'ARRIVED_AT_DESTINATION',
    'Listo para entrega': 'READY_FOR_DELIVERY',
    'Entregado': 'DELIVERED',
  }
  return map[status] || 'IN_TRANSIT'
}

export const reverseCargoType = (tipo: string) => {
  const map: Record<string, PrismaCargo['type']> = {
    'Marino': 'MARITIME',
    'Aereo': 'AIR',
  }
  return map[tipo] || 'MARITIME'
}

export const reverseContainerStatus = (status: string) => {
  const map: Record<string, PrismaCargoManagement['status']> = {
    'Recibido en Bodega': 'RECEIVED_IN_WAREHOUSE',
    'En transito': 'IN_TRANSIT',
    'Arribo PTY': 'ARRIVED_PANAMA',
    'Listo para Entrega': 'READY_FOR_DELIVERY',
  }
  return map[status] || 'RECEIVED_IN_WAREHOUSE'
}

// Extended company type with user counts
export interface CompanyWithCounts extends Company {
  _count?: {
    users: number
    cargos: number
  }
}

export interface DashboardStats {
  totalCargos: number
  cargosEnTransito: number
  cargosListosEntrega: number
  contenedoresActivos: number
}

export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ResetPasswordForm {
  email: string
}

export interface MenuItem {
  id: string
  label: string
  icon: string
  path: string
  roles: UserRole[]
  children?: MenuItem[]
}