export type ItemType = 'lost' | 'found'
export type ItemStatus = 'active' | 'claimed' | 'returned' | 'archived'

export interface Item {
  id: string
  type: ItemType
  title: string
  description: string
  category: string
  tags: string[]
  color: string
  brand: string
  dateEvent: string
  country: string
  city: string
  area: string
  status: ItemStatus
  reward?: string
  ownerId: string
  ownerName: string
  proofQuestion: string
  images: string[]
  createdAt: string
  handoffCode?: string
  sample?: boolean
}

export interface Profile {
  id: string
  name: string
  avatar: string
  isAdmin?: boolean
}

export interface Conversation {
  id: string
  itemId: string
  aId: string
  bId: string
  status: 'request' | 'active' | 'blocked'
  lastMsgAt: string
}

export interface Message {
  id: string
  convoId: string
  senderId: string
  body: string
  image?: string
  readAt?: string
  createdAt: string
}

export interface Claim {
  id: string
  itemId: string
  claimantId: string
  claimantName: string
  answer: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}
