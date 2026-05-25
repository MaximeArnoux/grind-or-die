'use server'

import { createClient } from '@/lib/supabase/server'
import { ADMIN_USER_ID } from '@/lib/constants/admin'
import { revalidatePath } from 'next/cache'

export async function adminDeleteLog(logId: string, profileUsername: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_USER_ID) return { success: false, error: 'Non autorisé' }

  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('id', logId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/profil/${profileUsername}`)
  return { success: true }
}
