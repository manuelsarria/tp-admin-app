import React from 'react'

export const metadata = {
  title: 'Pantalla de Rendimiento',
}

export default function PantallaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A' }}>{children}</div>
  )
}
