import { useEffect, useState } from 'react'
import type { Claim, Conversation, Item, Message, Profile } from './types'
import { nowIso, uid } from './types'

const K = {
  items: 'lf_items_v1',
  convos: 'lf_convos_v1',
  msgs: 'lf_msgs_v1',
  claims: 'lf_claims_v1',
  alerts: 'lf_alerts_v1'
}

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
      id: 'seed_1', type: 'found', title: 'Black leather bifold wallet', description: 'Found on a bench near the central park entrance. Contains cards but no cash. Tell me the initials inside to claim.',
      category: 'Wallets & Purses', tags: ['Leather', 'Bifold', 'Contains ID'], color: 'Black', brand: 'Unbranded',
      dateEvent: new Date(t - 86400000).toISOString().slice(0, 10), country: 'United States', city: 'New York', area: 'City Park',
      status: 'active', ownerId: 'demo_finder', ownerName: 'Ava M.', proofQuestion: 'What initials are embossed inside?',
      images: [], createdAt: iso(60 * 26)
    },
    {
      id: 'seed_2', type: 'lost', title: 'Silver MacBook 13-inch in grey sleeve', description: 'Left in library reading room, grey sleeve with a small mountain sticker. Reward offered.',
      category: 'Laptops', tags: ['MacBook', '13-inch', 'In sleeve'], color: 'Silver', brand: 'Apple',
      dateEvent: new Date(t - 2 * 86400000).toISOString().slice(0, 10), country: 'United Kingdom', city: 'London', area: 'Library',
      status: 'active', reward: 'Coffee + eternal gratitude', ownerId: 'demo_seeker', ownerName: 'Daniel K.', proofQuestion: 'What sticker is on the sleeve?',
      images: [], createdAt: iso(60 * 50)
    },
    {
      id: 'seed_3', type: 'found', title: 'Set of keys with blue lanyard', description: 'Three keys + gym fob on a blue lanyard. Found at bus stop.',
      category: 'Keys', tags: ['Key bunch', 'Lanyard'], color: 'Blue', brand: '',
      dateEvent: new Date().toISOString().slice(0, 10), country: 'India', city: 'Bengaluru', area: 'Bus Stop',
      status: 'active', ownerId: 'demo_finder', ownerName: 'Ava M.', proofQuestion: 'How many keys + what fob?',
      images: [], createdAt: iso(60 * 5)
    },
    {
      id: 'seed_4', type: 'lost', title: 'AirPods Pro with white case', description: 'Lost on morning metro, white case with tiny scratch on lid.',
      category: 'Audio & Headphones', tags: ['AirPods', 'Charging case'], color: 'White', brand: 'Apple',
      dateEvent: new Date().toISOString().slice(0, 10), country: 'Singapore', city: 'Singapore', area: 'Metro / Subway',
      status: 'active', ownerId: 'demo_seeker', ownerName: 'Daniel K.', proofQuestion: 'What mark is on the case lid?',
      images: [], createdAt: iso(90)
    }
  ]
}

export function useLocalDB() {
  const [items, setItems] = useState<Item[]>(() => load(K.items, seedItems()))
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
