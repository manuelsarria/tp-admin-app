import { z } from 'zod'

// ============================================
// COMPANY SCHEMAS
// ============================================

export const createCompanySchema = z.object({
  company_id: z.string().min(1, 'Company ID is required'),
  name: z.string().min(1, 'Company name is required'),
  ruc: z.string().min(1, 'RUC is required'),
  dv: z.string().min(1, 'DV is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  website: z.string().optional(),
  industry: z.string().optional(),
  employees: z.string().optional(),
  established: z.string().optional(),
})

export const updateCompanySchema = createCompanySchema.partial().extend({
  isActive: z.boolean().optional(),
})

// ============================================
// CONTAINER SCHEMAS
// ============================================

export const createContainerSchema = z.object({
  bl: z.string().min(1, 'BL is required'),
  eta: z.string().datetime().or(z.date()),
  arrivalDate: z.string().datetime().or(z.date()).optional(),
  departureDate: z.string().datetime().or(z.date()).optional(),
  shippingLine: z.string().min(1, 'Shipping line is required'),
})

export const updateContainerSchema = createContainerSchema.partial()

// ============================================
// CARGO SCHEMAS
// ============================================

export const cargoStatusEnum = z.enum([
  'IN_TRANSIT',
  'ARRIVED_AT_DESTINATION',
  'READY_FOR_DELIVERY',
  'DELIVERED',
])

export const cargoTypeEnum = z.enum(['MARITIME', 'AIR'])

export const createCargoSchema = z.object({
  tracking: z.string().min(1, 'Tracking number is required'),
  status: cargoStatusEnum.default('IN_TRANSIT'),
  type: cargoTypeEnum.default('MARITIME'),
  companyId: z.string().optional(),
})

export const updateCargoSchema = createCargoSchema.partial()

// ============================================
// CARGO MANAGEMENT SCHEMAS
// ============================================

export const containerStatusEnum = z.enum([
  'RECEIVED_IN_WAREHOUSE',
  'IN_TRANSIT',
  'ARRIVED_PANAMA',
  'READY_FOR_DELIVERY',
])

export const createCargoManagementSchema = z.object({
  containerNumber: z.string().optional(),
  eta: z.string().or(z.date()).optional(),
  location: z.string().optional(),
  status: containerStatusEnum.default('RECEIVED_IN_WAREHOUSE'),
  shippingLine: z.string().optional(),
  departureDate: z.string().or(z.date()).optional().nullable(),
})

export const updateCargoManagementSchema = createCargoManagementSchema.partial()

// ============================================
// USER SCHEMAS
// ============================================

export const userRoleEnum = z.enum(['ADMIN', 'WORKER', 'BUSINESS_USER', 'CUSTOMER_USER'])

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: userRoleEnum.default('BUSINESS_USER'),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  companyId: z.string().optional(),
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  isActive: z.boolean().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ============================================
// PAGINATION & FILTERING
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(10000).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const companyFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  industry: z.string().optional(),
})

export const containerFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  shippingLine: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const cargoFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: cargoStatusEnum.optional(),
  type: cargoTypeEnum.optional(),
  companyId: z.string().optional(),
})

export const cargoManagementFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: containerStatusEnum.optional(),
  shippingLine: z.string().optional(),
})

// ============================================
// FCL SHIPMENT SCHEMAS
// ============================================

export const transportTypeEnum = z.enum(['AIR', 'MAR'])

export const fclShipmentPieceSchema = z.object({
  quantity: z.number().int().positive().default(1),
  length: z.number().positive().optional().nullable(),
  width: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
})

export const createFclShipmentSchema = z.object({
  trackingWarehouse: z.string().min(1, 'Tracking/WH is required'),
  forwarder: z.string().optional(),
  mailbox: z.string().min(1, 'Mailbox is required'),
  transportType: transportTypeEnum.default('MAR'),
  containerNumber: z.string().min(1, 'Container number is required'),
  approximateDate: z.string().datetime().or(z.date()).optional(),
  misidentified: z.boolean().default(false),
  dangerousGoods: z.boolean().default(false),
  refrigeratedProduct: z.boolean().default(false),
  companyId: z.string().optional(),
  itemType: z.enum(['company', 'user']).optional().nullable(),
  userId: z.string().optional().nullable(),
  totalCbm: z.number().optional().nullable(),
  totalWeight: z.number().optional().nullable(),
  comments: z.string().optional().nullable(),
  additionalCode: z.string().optional().nullable(),
  pieces: z.array(fclShipmentPieceSchema).optional(),
})

export const updateFclShipmentSchema = createFclShipmentSchema.partial()

export const fclShipmentFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  transportType: transportTypeEnum.optional(),
  misidentified: z.coerce.boolean().optional(),
})

// ============================================
// LCL SHIPMENT SCHEMAS
// ============================================

export const createLclShipmentSchema = z.object({
  blNumber: z.string().min(1, 'BL Number is required'),
  eta: z.string().datetime().or(z.date()),
  notes: z.string().optional(),
  departureDate: z.string().datetime().or(z.date()),
  cargoAmount: z.number().nonnegative().default(0),
  totalCbm: z.number().nonnegative().default(0),
  empresaId: z.string().optional(),
  itemType: z.enum(['company', 'user']).optional().nullable(),
  userId: z.string().optional().nullable(),
})

export const updateLclShipmentSchema = createLclShipmentSchema.partial()

export const lclShipmentFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type CreateContainerInput = z.infer<typeof createContainerSchema>
export type UpdateContainerInput = z.infer<typeof updateContainerSchema>
export type CreateCargoInput = z.infer<typeof createCargoSchema>
export type UpdateCargoInput = z.infer<typeof updateCargoSchema>
export type CreateCargoManagementInput = z.infer<typeof createCargoManagementSchema>
export type UpdateCargoManagementInput = z.infer<typeof updateCargoManagementSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type CompanyFilterInput = z.infer<typeof companyFilterSchema>
export type ContainerFilterInput = z.infer<typeof containerFilterSchema>
export type CargoFilterInput = z.infer<typeof cargoFilterSchema>
export type CargoManagementFilterInput = z.infer<typeof cargoManagementFilterSchema>
export type CreateFclShipmentInput = z.infer<typeof createFclShipmentSchema>
export type UpdateFclShipmentInput = z.infer<typeof updateFclShipmentSchema>
export type FclShipmentFilterInput = z.infer<typeof fclShipmentFilterSchema>
export type CreateLclShipmentInput = z.infer<typeof createLclShipmentSchema>
export type UpdateLclShipmentInput = z.infer<typeof updateLclShipmentSchema>
export type LclShipmentFilterInput = z.infer<typeof lclShipmentFilterSchema>
