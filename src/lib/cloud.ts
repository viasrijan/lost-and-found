import { supabase } from './supabase'
import type { Claim, Conversation, Item, Message, Profile } from './types'
import { nowIso } from './types'

export const cloudReady = () => supabase !== null

function orderPair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a]
}

export function rowToItem(row: Record<string, any>, images: string[]): Item {
  return {
    id: String(row.id),
    type: row.type === 'lost' ? 'lost' : 'found',
    title: row.title ?? '',
    description: row.description ?? '',
    category: row.category ?? 'Other',
    tags: Array.isArray(row.tags) ? row.tags : [],
    color: row.color ?? '',
    brand: row.brand ?? '',
    dateEvent: row.date_event ?? '',
    country: row.country ?? '',
    city: row.city ?? '',
    area: row.area ?? '',
    status: (['active', 'claimed', 'returned', 'archived'] as const).includes(row.status) ? row.status : 'active',
    reward: row.reward ?? undefined,
    ownerId: String(row.owner_id ?? ''),
    ownerName: 'Member',
    proofQuestion: row.proof_question ?? '',
    images,
    createdAt: row.created_at ?? nowIso(),
    handoffCode: row.handoff_code ?? undefined
  }
}

export async function ensureProfile(p: Profile): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('profiles').upsert(
    { id: p.id, display_name: p.name, avatar_url: p.avatar },
    { onConflict: 'id' }
  )
  if (error) throw new Error(error.message)
}

export async function fetchCloudItems(): Promise<Item[]> {
  if (!supabase) return []
  const { data: rows, error } = await supabase
    .from('items')
    .select('id,type,title,description,category,tags,color,brand,date_event,country,city,area,status,reward,owner_id,proof_question,handoff_code,created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  const list = rows ?? []
  if (list.length === 0) return []
  const ids = list.map((r: any) => r.id)
  const { data: imgs } = await supabase
    .from('item_images')
    .select('item_id,url,position')
    .in('item_id', ids)
    .order('position', { ascending: true })
  const byId = new Map<string, string[]>()
  for (const im of (imgs ?? []) as any[]) {
    const arr = byId.get(String(im.item_id)) ?? []
    arr.push(im.url)
    byId.set(String(im.item_id), arr)
  }
  return list.map((r: any) => rowToItem(r, byId.get(String(r.id)) ?? []))
}

export async function insertCloudItem(item: Omit<Item, 'id' | 'createdAt' | 'status'>): Promise<{ id: string }> {
  if (!supabase) throw new Error('cloud unavailable')
  const { data, error } = await supabase.from('items').insert({
    type: item.type,
    title: item.title,
    description: item.description,
    category: item.category,
    tags: item.tags,
    color: item.color,
    brand: item.brand,
    date_event: item.dateEvent,
    country: item.country,
    city: item.city,
    area: item.area,
    status: 'active',
    reward: item.reward ?? null,
    owner_id: item.ownerId,
    proof_question: item.proofQuestion
  }).select('id').single()
  if (error || !data) throw new Error(error?.message ?? 'insert failed')
  return { id: String((data as any).id) }
}

export async function uploadDataUrl(dataUrl: string, ownerId: string): Promise<string | null> {
  if (!supabase) return null
  try {
    const m = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/)
    if (!m) return dataUrl.startsWith('http') ? dataUrl : null
    const mime = m[1]
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
    const bin = atob(m[2])
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const path = `${ownerId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('item-photos').upload(path, bytes, { contentType: mime, upsert: false })
    if (error) return null
    const { data } = supabase.storage.from('item-photos').getPublicUrl(path)
    return data.publicUrl
  } catch {
    return null
  }
}

export async function insertCloudImages(itemId: string, urls: string[]): Promise<void> {
  if (!supabase || urls.length === 0) return
  const { error } = await supabase.from('item_images').insert(
    urls.map((url, i) => ({ item_id: itemId, url, position: i }))
  )
  if (error) throw new Error(error.message)
}

export async function updateCloudItemStatus(itemId: string, status: Item['status'], handoffCode?: string): Promise<void> {
  if (!supabase) return
  const patch: Record<string, any> = { status }
  if (handoffCode !== undefined) patch.handoff_code = handoffCode
  const { error } = await supabase.from('items').update(patch).eq('id', itemId)
  if (error) throw new Error(error.message)
}

export async function deleteCloudItem(itemId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
}

export function rowToClaim(row: Record<string, any>): Claim {
  return {
    id: String(row.id),
    itemId: String(row.item_id),
    claimantId: String(row.claimant_id),
    claimantName: 'Member',
    answer: row.answer ?? '',
    status: row.status ?? 'pending',
    createdAt: row.created_at ?? nowIso()
  }
}

export async function fetchCloudClaims(uid: string, myItemIds: string[]): Promise<Claim[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('claims')
    .select('id,item_id,claimant_id,answer,status,created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  const mine = new Set(myItemIds)
  return ((data ?? []) as any[])
    .filter(r => String(r.claimant_id) === uid || mine.has(String(r.item_id)))
    .map(rowToClaim)
}

export async function insertCloudClaim(itemId: string, claimantId: string, answer: string): Promise<{ id: string }> {
  if (!supabase) throw new Error('cloud unavailable')
  const { data, error } = await supabase.from('claims')
    .insert({ item_id: itemId, claimant_id: claimantId, answer, status: 'pending' })
    .select('id').single()
  if (error || !data) throw new Error(error?.message ?? 'insert failed')
  return { id: String((data as any).id) }
}

export async function updateCloudClaim(id: string, status: Claim['status']): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('claims').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

export function rowToConvo(row: Record<string, any>): Conversation {
  return {
    id: String(row.id),
    itemId: String(row.item_id),
    aId: String(row.a_id),
    bId: String(row.b_id),
    status: row.status ?? 'request',
    lastMsgAt: row.last_msg_at ?? nowIso()
  }
}

export async function fetchMyConvos(uid: string): Promise<Conversation[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('conversations')
    .select('id,item_id,a_id,b_id,status,last_msg_at')
    .or(`a_id.eq.${uid},b_id.eq.${uid}`)
    .order('last_msg_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return ((data ?? []) as any[]).map(rowToConvo)
}

export async function insertCloudConvo(itemId: string, me: string, other: string): Promise<{ id: string }> {
  if (!supabase) throw new Error('cloud unavailable')
  const [a, b] = orderPair(me, other)
  const { data, error } = await supabase.from('conversations')
    .insert({ item_id: itemId, a_id: a, b_id: b, status: 'request' })
    .select('id').single()
  if (error || !data) throw new Error(error?.message ?? 'insert failed')
  return { id: String((data as any).id) }
}

export async function updateCloudConvo(id: string, status: Conversation['status']): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('conversations')
    .update({ status, last_msg_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export function rowToMessage(row: Record<string, any>): Message {
  return {
    id: String(row.id),
    convoId: String(row.convo_id),
    senderId: String(row.sender_id),
    body: row.body ?? '',
    image: row.image_url ?? undefined,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at ?? nowIso()
  }
}

export async function fetchConvoMessages(convoIds: string[]): Promise<Message[]> {
  if (!supabase || convoIds.length === 0) return []
  const { data, error } = await supabase
    .from('messages')
    .select('id,convo_id,sender_id,body,image_url,read_at,created_at')
    .in('convo_id', convoIds)
    .order('created_at', { ascending: true })
    .limit(500)
  if (error) throw new Error(error.message)
  return ((data ?? []) as any[]).map(rowToMessage)
}

export async function insertCloudMessage(convoId: string, senderId: string, body: string, image?: string): Promise<{ id: string }> {
  if (!supabase) throw new Error('cloud unavailable')
  const { data, error } = await supabase.from('messages')
    .insert({ convo_id: convoId, sender_id: senderId, body, image_url: image ?? null })
    .select('id').single()
  if (error || !data) throw new Error(error?.message ?? 'insert failed')
  await supabase.from('conversations').update({ last_msg_at: new Date().toISOString() }).eq('id', convoId)
  return { id: String((data as any).id) }
}

export async function markCloudRead(convoId: string, uid: string): Promise<void> {
  if (!supabase) return
  await supabase.from('messages').update({ read_at: new Date().toISOString() })
    .eq('convo_id', convoId).neq('sender_id', uid).is('read_at', null)
}
