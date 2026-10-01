import { createContext, useContext, useState, type ReactNode } from 'react'

const SearchCtx = createContext<{ q: string; setQ: (v: string) => void }>({
  q: '',
  setQ: () => undefined
})

export function SearchProvider({ children }: { children: ReactNode }) {
  const [q, setQ] = useState('')
  return <SearchCtx.Provider value={{ q, setQ }}>{children}</SearchCtx.Provider>
}

export function useSearch() {
  return useContext(SearchCtx)
}
