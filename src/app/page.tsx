'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginPage } from '@/components/auth/LoginPage'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth-token')
    if (token) {
      setIsAuthenticated(true)
      router.push('/dashboard')
    }
  }, [router])

  if (isAuthenticated) {
    return null // Will redirect to dashboard
  }

  return <LoginPage />
}