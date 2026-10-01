import { useEffect, useState } from 'react'
import type { Claim, Conversation, Item, Message, Profile } from './types'
import { nowIso, uid } from './types'

const K = {
  items: 'lf_items_v2',
  convos: 'lf_convos_v1',
  msgs: 'lf_msgs_v1',
  claims: 'lf_claims_v1',
  alerts: 'lf_alerts_v1'
}

// Previous cache key — real posts are migrated from it once (see initialItems).
const LEGACY_ITEMS_KEY = 'lf_items_v1'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function save(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    // quota: ignore, app keeps working in-memory
  }
}

function seedItems(): Item[] {
  const t = Date.now()
  const iso = (mins: number) => new Date(t - mins * 60000).toISOString()
  return [
    {
      id: 'seed_macbook', type: 'lost', title: 'Space-black MacBook 13-inch', description: 'Lost at the library reading room — dark aluminium body, no sleeve. Tell me the lock-screen picture to claim.',
      category: 'Laptops', tags: ['MacBook', '13-inch'], color: 'Black', brand: 'Apple',
      dateEvent: new Date(t - 2 * 86400000).toISOString().slice(0, 10), country: 'United Kingdom', city: 'London', area: 'Library',
      status: 'active', reward: 'Coffee + eternal gratitude', ownerId: 'demo_seeker', ownerName: 'Daniel K.', proofQuestion: 'What is on the lock screen?',
      images: ['/samples/macbook.jpg'], createdAt: iso(60 * 50), sample: true
    },
    {
      id: 'seed_airpods', type: 'lost', title: 'AirPods Pro in white retail box', description: 'Lost white AirPods Pro box with the earbuds pictured on the lid. Left on a car seat — tell me what else was visible to claim.',
      category: 'Audio & Headphones', tags: ['AirPods', 'Charging case'], color: 'White', brand: 'Apple',
      dateEvent: new Date().toISOString().slice(0, 10), country: 'Singapore', city: 'Singapore', area: 'Metro / Subway',
      status: 'active', ownerId: 'demo_seeker', ownerName: 'Daniel K.', proofQuestion: 'What else was visible in the photo?',
      images: ['/samples/airpods.jpg'], createdAt: iso(90), sample: true
    },
    {
      id: 'seed_keys', type: 'found', title: 'Keychain with red pocket knife', description: 'Found on a dark tabletop: two keys, a red Swiss-style pocket knife, a green patterned flashlight and a carabiner clip.',
      category: 'Keys', tags: ['Key bunch', 'With keychain'], color: 'Red', brand: '',
      dateEvent: new Date().toISOString().slice(0, 10), country: 'India', city: 'Bengaluru', area: 'Bus Stop',
      status: 'active', ownerId: 'demo_finder', ownerName: 'Ava M.', proofQuestion: 'What color is the flashlight?',
      images: ['/samples/keys.jpg'], createdAt: iso(60 * 5), sample: true
    },
    {
      id: 'seed_wallet', type: 'found', title: 'Black leather bifold wallet', description: 'Found held in hand — plain black bifold with no visible logo. Tell me the initials inside to claim.',
      category: 'Wallets & Purses', tags: ['Leather', 'Bifold', 'Contains ID'], color: 'Black', brand: 'Unbranded',
      dateEvent: new Date(t - 86400000).toISOString().slice(0, 10), country: 'United States', city: 'New York', area: 'City Park',
      status: 'active', ownerId: 'demo_finder', ownerName: 'Ava M.', proofQuestion: 'What initials are embossed inside?',
      images: ['/samples/wallet.jpg'], createdAt: iso(60 * 26), sample: true
    }
  ]
}

// Sample photos live in public/samples/. If a file is missing, fall back to
// a stable placeholder so cards never render broken.
export function sampleFallback(src: string): string {
  const m = src.match(/\/samples\/(.+)\.jpg$/)
  return m ? `https://picsum.photos/seed/lf-${m[1]}/800/600` : src
}

function initialItems(): Item[] {
  const fresh = load<Item[] | null>(K.items, null)
  if (Array.isArray(fresh)) return fresh
  // First run on the v2 key: carry over real posts from v1, drop old samples.
  try {
    const raw = localStorage.getItem(LEGACY_ITEMS_KEY)
    if (raw) {
      const old = JSON.parse(raw) as Item[]
      const kept = old.filter(i => !i.sample && i.ownerId !== 'demo_finder' && i.ownerId !== 'demo_seeker' && !i.id.startsWith('seed_'))
      if (kept.length > 0) return [...kept, ...seedItems()]
    }
  } catch {
    // fall through to fresh seeds
  }
  return seedItems()
}

export function useLocalDB() {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [convos, setConvos] = useState<Conversation[]>(() => load(K.convos, []))
  const [msgs, setMsgs] = useState<Message[]>(() => load(K.msgs, []))
  const [claims, setClaims] = useState<Claim[]>(() => load(K.claims, []))
  const [alerts, setAlerts] = useState<string[]>(() => load(K.alerts, []))

  useEffect(() => { save(K.items, items) }, [items])
  useEffect(() => { save(K.convos, convos) }, [convos])
  useEffect(() => { save(K.msgs, msgs) }, [msgs])
  useEffect(() => { save(K.claims, claims) }, [claims])
  useEffect(() => { save(K.alerts, alerts) }, [alerts])

  return {
    items, setItems,
    convos, setConvos,
    msgs, setMsgs,
    claims, setClaims,
    alerts, setAlerts
  }
}

export type DB = ReturnType<typeof useLocalDB>

export function addItemHelper(list: Item[], data: Omit<Item, 'id' | 'createdAt' | 'status'>): Item[] {
  const item: Item = { ...data, id: uid('item'), createdAt: nowIso(), status: 'active' }
  return [item, ...list]
}

export function openOrGetConvo(convos: Conversation[], itemId: string, me: Profile, otherId: string): { list: Conversation[], convo: Conversation } {
  const existing = convos.find(c => c.itemId === itemId && ((c.aId === me.id && c.bId === otherId) || (c.aId === otherId && c.bId === me.id)))
  if (existing) return { list: convos, convo: existing }
  const isOwner = true
  void isOwner
  const convo: Conversation = {
    id: uid('convo'), itemId, aId: me.id, bId: otherId,
    status: 'request', lastMsgAt: nowIso()
  }
  return { list: [convo, ...convos], convo }
}

export function sendMsgHelper(msgs: Message[], convoId: string, senderId: string, body: string, image?: string): Message[] {
  const m: Message = { id: uid('msg'), convoId, senderId, body, image, createdAt: nowIso() }
  return [...msgs, m]
}

// Remove every local trace of a user (account deletion). Shared cache for
// other users' listings is preserved.
export function purgeUser(uid: string) {
  if (!uid) return
  try {
    const items = load<Item[]>(K.items, [])
    const removedItemIds = new Set(items.filter(i => i.ownerId === uid).map(i => i.id))
    save(K.items, items.filter(i => i.ownerId !== uid))
    const convos = load<Conversation[]>(K.convos, [])
    const removedConvoIds = new Set(convos.filter(c => c.aId === uid || c.bId === uid).map(c => c.id))
    save(K.convos, convos.filter(c => !(c.aId === uid || c.bId === uid)))
    save(K.msgs, load<Message[]>(K.msgs, []).filter(m => !removedConvoIds.has(m.convoId)))
    save(K.claims, load<Claim[]>(K.claims, []).filter(c => c.claimantId !== uid && !removedItemIds.has(c.itemId)))
  } catch {
    // never block account deletion on storage errors
  }
}
