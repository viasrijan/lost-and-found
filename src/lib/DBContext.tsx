import { createContext, useContext, type ReactNode } from 'react'
import { useLocalDB, type DB } from './store'

const Ctx = createContext<DB | null>(null)

export function DBProvider({ children }: { children: ReactNode }) {
  const db = useLocalDB()
  return <Ctx.Provider value={db}>{children}</Ctx.Provider>
}

export function useDB(): DB {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDB outside provider')
  return v
}
