import React from 'react'

type Props = { children: React.ReactNode }

export default function PageShell({ children }: Props) {
  return (
    <div className="min-vh-100 w-100 position-relative" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <div className="app-radial"></div>
      <div className="app-grid"></div>
      <main className="container py-4 py-md-5" style={{ maxWidth: 1100 }}>
        {children}
      </main>
    </div>
  )
}