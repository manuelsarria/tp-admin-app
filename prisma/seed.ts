import { PrismaClient, UserRole, CargoStatus, CargoType, ContainerStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.cargoManagement.deleteMany()
  await prisma.cargo.deleteMany()
  await prisma.container.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()

  // ============================================
  // COMPANIES
  // ============================================
  const companies = await prisma.company.createMany({
    data: [
      {
        id: 'company-1',
        name: 'LOGÍSTICA PANAMÁ S.A.',
        ruc: '155123456-2-2023',
        dv: '7',
        address: 'Avenida Balboa, Edificio Torre Global Bank, Piso 15, Ciudad de Panamá',
        phone: '+507-6234-5678',
        email: 'info@logisticapanama.com',
        website: 'www.logisticapanama.com',
        industry: 'Logística y Transporte',
        employees: '50-100',
        established: '2020',
        isActive: true,
      },
      {
        id: 'company-2',
        name: 'TRANSPORTES DEL ISTMO S.A.',
        ruc: '155654321-1-2021',
        dv: '3',
        address: 'Calle 50, Centro Comercial Multiplaza, Local 205, Ciudad de Panamá',
        phone: '+507-7345-6789',
        email: 'contacto@transportesistmo.com',
        website: 'www.transportesistmo.com',
        industry: 'Transporte Terrestre',
        employees: '25-50',
        established: '2021',
        isActive: true,
      },
      {
        id: 'company-3',
        name: 'CARGO EXPRESS PTY',
        ruc: '155987654-3-2019',
        dv: '9',
        address: 'Zona Libre de Colón, Edificio 45, Oficina 302',
        phone: '+507-4456-7890',
        email: 'info@cargoexpress.com.pa',
        website: 'www.cargoexpress.com.pa',
        industry: 'Carga Internacional',
        employees: '100-200',
        established: '2019',
        isActive: true,
      },
      {
        id: 'company-4',
        name: 'DISTRIBUIDORA NACIONAL',
        ruc: '155456789-4-2018',
        dv: '1',
        address: 'Parque Industrial de Panamá Pacífico, Bodega 15',
        phone: '+507-2567-8901',
        email: 'ventas@distribuidoranacional.com',
        website: 'www.distribuidoranacional.com',
        industry: 'Distribución',
        employees: '75-100',
        established: '2018',
        isActive: false,
      },
    ],
  })

  console.log(`✅ Created ${companies.count} companies`)

  // ============================================
  // USERS
  // ============================================
  const hashedPassword = await bcrypt.hash('password123', 10)

  const users = await prisma.user.createMany({
    data: [
      // ========================================
      // TEST USERS - Easy to remember credentials
      // ========================================
      {
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
        phone: '+507-1111-0000',
        isActive: true,
      },
      {
        email: 'worker@test.com',
        password: hashedPassword,
        name: 'Worker User',
        role: UserRole.WORKER,
        phone: '+507-2222-0000',
        companyId: null,
        isActive: true,
      },
      {
        email: 'business@test.com',
        password: hashedPassword,
        name: 'Business User',
        role: UserRole.BUSINESS_USER,
        phone: '+507-3333-0000',
        companyId: 'company-1',
        isActive: true,
      },

      // ========================================
      // ORIGINAL USERS
      // ========================================
      {
        email: 'admin@cnclogistics.com',
        password: hashedPassword,
        name: 'Administrator',
        role: UserRole.ADMIN,
        phone: '+507-1234-5678',
        isActive: true,
      },
      {
        email: 'juan.perez@logisticapanama.com',
        password: hashedPassword,
        name: 'Juan Pérez',
        role: UserRole.BUSINESS_USER,
        phone: '+507-6234-1111',
        companyId: 'company-1',
        isActive: true,
      },
      {
        email: 'carlos.rodriguez@logisticapanama.com',
        password: hashedPassword,
        name: 'Carlos Rodríguez',
        role: UserRole.WORKER,
        phone: '+507-6234-2222',
        companyId: 'company-1',
        isActive: true,
      },
      {
        email: 'maria.gonzalez@transportesistmo.com',
        password: hashedPassword,
        name: 'María González',
        role: UserRole.BUSINESS_USER,
        phone: '+507-7345-1111',
        companyId: 'company-2',
        isActive: true,
      },
      {
        email: 'roberto.silva@cargoexpress.com.pa',
        password: hashedPassword,
        name: 'Roberto Silva',
        role: UserRole.BUSINESS_USER,
        phone: '+507-4456-1111',
        companyId: 'company-3',
        isActive: true,
      },
      {
        email: 'ana.martinez@email.com',
        password: hashedPassword,
        name: 'Ana Martínez',
        role: UserRole.WORKER,
        phone: '+507-9999-8888',
        companyId: null,
        isActive: true,
      },
    ],
  })

  console.log(`✅ Created ${users.count} users`)

  // ============================================
  // CONTAINERS
  // ============================================
  const containers = await prisma.container.createMany({
    data: [
      {
        bl: 'BL-0012345',
        eta: new Date('2025-10-04'),
        arrivalDate: new Date('2025-10-08'),
        shippingLine: 'Maersk',
      },
      {
        bl: 'BL-0098765',
        eta: new Date('2025-10-06'),
        shippingLine: 'MSC',
      },
      {
        bl: 'BL-0123789',
        eta: new Date('2025-10-10'),
        arrivalDate: new Date('2025-10-12'),
        departureDate: new Date('2025-10-15'),
        shippingLine: 'CMA CGM',
      },
      {
        bl: 'BL-0456123',
        eta: new Date('2025-10-15'),
        shippingLine: 'COSCO',
      },
      {
        bl: 'BL-0789456',
        eta: new Date('2025-10-20'),
        arrivalDate: new Date('2025-10-22'),
        shippingLine: 'Hapag-Lloyd',
      },
    ],
  })

  console.log(`✅ Created ${containers.count} containers`)

  // ============================================
  // CARGO
  // ============================================
  const cargos = await prisma.cargo.createMany({
    data: [
      {
        tracking: 'TGHU9988776',
        status: CargoStatus.IN_TRANSIT,
        type: CargoType.MARITIME,
        companyId: 'company-1',
      },
      {
        tracking: 'WHCN1000TZ',
        status: CargoStatus.READY_FOR_DELIVERY,
        type: CargoType.AIR,
        companyId: 'company-1',
      },
      {
        tracking: 'BLMX789456',
        status: CargoStatus.ARRIVED_AT_DESTINATION,
        type: CargoType.MARITIME,
        companyId: 'company-2',
      },
      {
        tracking: 'AIRY5566778',
        status: CargoStatus.IN_TRANSIT,
        type: CargoType.AIR,
        companyId: 'company-2',
      },
      {
        tracking: 'MSKB2233445',
        status: CargoStatus.DELIVERED,
        type: CargoType.MARITIME,
        companyId: 'company-3',
      },
    ],
  })

  console.log(`✅ Created ${cargos.count} cargos`)

  // ============================================
  // CARGO MANAGEMENT
  // ============================================
  const cargoManagement = await prisma.cargoManagement.createMany({
    data: [
      {
        containerNumber: 'MSCU1234567',
        eta: new Date('2025-09-19'),
        location: 'Central Warehouse',
        status: ContainerStatus.RECEIVED_IN_WAREHOUSE,
        shippingLine: 'Maersk',
        departureDate: new Date('2025-09-10'),
      },
      {
        containerNumber: 'MSCU7654321',
        eta: new Date('2025-09-21'),
        location: 'Free Zone Warehouse',
        status: ContainerStatus.RECEIVED_IN_WAREHOUSE,
        shippingLine: 'MSC',
      },
      {
        containerNumber: 'TGHU9988776',
        eta: new Date('2025-09-18'),
        location: 'Colon Port',
        status: ContainerStatus.IN_TRANSIT,
        shippingLine: 'CMA CGM',
      },
      {
        containerNumber: 'WHCN10000TZ',
        eta: new Date('2025-09-20'),
        location: 'Balboa Terminal',
        status: ContainerStatus.ARRIVED_PANAMA,
        shippingLine: 'COSCO',
      },
      {
        containerNumber: 'BLMX789456',
        eta: new Date('2025-09-22'),
        location: 'Pacific Free Zone',
        status: ContainerStatus.READY_FOR_DELIVERY,
        shippingLine: 'Hapag-Lloyd',
      },
      {
        containerNumber: 'WHCN20001TZ',
        eta: new Date('2025-09-25'),
        location: 'Colon Depot',
        status: ContainerStatus.ARRIVED_PANAMA,
        shippingLine: 'ONE',
      },
      {
        containerNumber: 'WHCN30002TZ',
        eta: new Date('2025-09-28'),
        location: 'Panama Logistics',
        status: ContainerStatus.READY_FOR_DELIVERY,
        shippingLine: 'Evergreen',
      },
    ],
  })

  console.log(`✅ Created ${cargoManagement.count} cargo management records`)

  console.log('✨ Seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Companies: ${companies.count}`)
  console.log(`   - Users: ${users.count}`)
  console.log(`   - Containers: ${containers.count}`)
  console.log(`   - Cargos: ${cargos.count}`)
  console.log(`   - Cargo Management: ${cargoManagement.count}`)
  console.log('\n🔐 Test credentials:')
  console.log('   Email: admin@cnclogistics.com')
  console.log('   Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
