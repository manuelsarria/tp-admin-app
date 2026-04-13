import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      companyId?: string | null
      mailbox?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    companyId?: string | null
    mailbox?: string | null
    company?: {
      id: string
      name: string
    } | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    companyId?: string | null
    mailbox?: string | null
  }
}
