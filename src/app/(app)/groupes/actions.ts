'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGroup(name: string, description: string | null, isPublic: boolean, password?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      created_by: user.id,
      is_public: isPublic,
      password: isPublic ? null : (password?.trim() || null),
    })
    .select('id')
    .single()

  if (groupError) return { error: `Impossible de créer le groupe: ${groupError.message}` }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })

  if (memberError) return { error: `Groupe créé mais impossible de t'ajouter: ${memberError.message}` }

  revalidatePath('/groupes')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateGroup(groupId: string, name: string, isPublic: boolean, newPassword?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: "Tu n'es pas admin de ce groupe" }

  const updateData: Record<string, unknown> = { name: name.trim(), is_public: isPublic }
  if (isPublic) {
    updateData.password = null
  } else if (newPassword?.trim()) {
    updateData.password = newPassword.trim()
  }

  const { error } = await supabase.from('groups').update(updateData).eq('id', groupId)
  if (error) return { error: `Impossible de modifier: ${error.message}` }

  revalidatePath('/groupes')
  return { success: true }
}

export async function joinPublicGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase.rpc('join_public_group', { group_id_input: groupId })
  if (error) return { error: `Impossible de rejoindre: ${error.message}` }
  if (data?.error) return { error: data.error }

  revalidatePath('/groupes')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function joinGroup(inviteCode: string, password?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase.rpc('join_group_by_code', {
    invite_code_input: inviteCode.trim().toUpperCase(),
    password_input: password ?? null,
  })

  if (error) return { error: `Impossible de rejoindre: ${error.message}` }
  if (data?.error) return { error: data.error }

  revalidatePath('/groupes')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function inviteByUsername(groupId: string, username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: adminCheck } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (adminCheck?.role !== 'admin') return { error: "Tu n'es pas admin de ce groupe" }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', username.trim())
    .single()

  if (!profile) return { error: 'Utilisateur introuvable' }

  const { data: group } = await supabase
    .from('groups')
    .select('max_members')
    .eq('id', groupId)
    .single()

  const { count } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  if ((count ?? 0) >= (group?.max_members ?? 10)) return { error: 'Groupe complet (10 membres max)' }

  const { data: existing } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (existing) return { error: 'Cet utilisateur est déjà dans le groupe' }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: profile.id, role: 'member' })

  if (error) return { error: `Impossible d'inviter: ${error.message}` }

  revalidatePath('/groupes')
  return { success: true }
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: "Tu n'es pas dans ce groupe" }

  if (membership.role === 'admin') {
    // Check if there are other members
    const { data: others } = await supabase
      .from('group_members')
      .select('user_id, joined_at')
      .eq('group_id', groupId)
      .neq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)

    if (!others || others.length === 0) {
      // Seul membre → supprimer le groupe
      const { error } = await supabase.from('groups').delete().eq('id', groupId)
      if (error) return { error: 'Impossible de supprimer le groupe' }
      revalidatePath('/groupes')
      revalidatePath('/dashboard')
      revalidatePath('/classements')
      return { success: true }
    }

    // Promouvoir le membre suivant comme admin
    const { error: promoteError } = await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', others[0].user_id)

    if (promoteError) return { error: "Impossible de transférer le rôle d'admin" }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) return { error: 'Impossible de quitter le groupe' }

  revalidatePath('/groupes')
  revalidatePath('/dashboard')
  revalidatePath('/classements')
  return { success: true }
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'admin') return { error: "Tu n'es pas admin de ce groupe" }

  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) return { error: `Impossible de supprimer le groupe: ${error.message}` }

  revalidatePath('/groupes')
  revalidatePath('/dashboard')
  revalidatePath('/classements')
  return { success: true }
}
