'use client'

import { createContext, useContext, ReactNode } from 'react'

export type Role = 'superadmin' | 'staff' | 'readonly'

type RoleContextType = {
  role: Role
  isReadonly: boolean
  isSuperadmin: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({
  role,
  children,
}: {
  role: Role
  children: ReactNode
}) {
  const isReadonly = role === 'readonly'
  const isSuperadmin = role === 'superadmin'

  return (
    <RoleContext.Provider value={{ role, isReadonly, isSuperadmin }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole(): RoleContextType {
  const ctx = useContext(RoleContext)
  if (!ctx) {
    return {
      role: 'readonly',
      isReadonly: true,
      isSuperadmin: false,
    }
  }
  return ctx
}
