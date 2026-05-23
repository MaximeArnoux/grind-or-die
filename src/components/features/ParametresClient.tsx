'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import type { Profile, Activity } from '@/types'

interface Props {
  profile: Profile | null
  objectives: any[]
  activities: Activity[]
  latestWeight: number | null
  userId: string
}

export function ParametresClient({ profile, objectives, activities, latestWeight, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Profile form
  const [username, setUsername] = useState(profile?.username ?? '')
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [profileObjectives, setProfileObjectives] = useState(profile?.objectives ?? '')
  const [heightCm, setHeightCm] = useState(profile?.height_cm?.toString() ?? '')
  const [weightKg, setWeightKg] = useState(latestWeight?.toString() ?? '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Objective modal
  const [showObjective, setShowObjective] = useState(false)
  const [objActivity, setObjActivity] = useState('')
  const [objCount, setObjCount] = useState('1')
  const [objPeriod, setObjPeriod] = useState<'daily' | 'weekly'>('weekly')
  const [objMultiplier, setObjMultiplier] = useState('1.5')
  const [objLoading, setObjLoading] = useState(false)

  // Password
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  async function saveProfile() {
    setProfileLoading(true)
    try {
      await supabase.from('profiles').update({
        username: username.toLowerCase(),
        full_name: fullName || null,
        bio: bio || null,
        objectives: profileObjectives || null,
        height_cm: heightCm ? parseInt(heightCm) : null,
      }).eq('id', userId)

      if (weightKg && parseFloat(weightKg) !== latestWeight) {
        await supabase.from('weight_logs').insert({
          user_id: userId,
          weight_kg: parseFloat(weightKg),
        })
      }

      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 2000)
      router.refresh()
    } finally {
      setProfileLoading(false)
    }
  }

  async function addObjective() {
    if (!objActivity) return
    setObjLoading(true)
    try {
      await supabase.from('user_objectives').insert({
        user_id: userId,
        activity_id: objActivity,
        target_count: parseInt(objCount),
        period: objPeriod,
        multiplier: parseFloat(objMultiplier),
      })
      setShowObjective(false)
      setObjActivity(''); setObjCount('1'); setObjMultiplier('1.5')
      router.refresh()
    } finally { setObjLoading(false) }
  }

  async function removeObjective(id: string) {
    await supabase.from('user_objectives').update({ is_active: false }).eq('id', id)
    router.refresh()
  }

  async function changePassword() {
    if (newPassword.length < 8) return
    setPwLoading(true)
    await supabase.auth.updateUser({ password: newPassword })
    setPwSuccess(true)
    setNewPassword('')
    setTimeout(() => setPwSuccess(false), 2000)
    setPwLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white">
                {username.charAt(0).toUpperCase()}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                <Camera size={11} className="text-gray-300" />
              </button>
            </div>
            <p className="text-xs text-gray-500">Photo de profil (bientôt disponible)</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Pseudo" value={username} onChange={e => setUsername(e.target.value)} placeholder="monpseudo" />
            <Input label="Nom complet (optionnel)" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Prénom Nom" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Une ligne sur toi..."
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Objectifs (visibles sur le profil)</label>
            <textarea
              value={profileObjectives}
              onChange={e => setProfileObjectives(e.target.value)}
              placeholder="Ex: Perdre 5kg d'ici l'été, finir mon projet SaaS..."
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Taille (cm)" type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="175" />
            <Input label="Poids actuel (kg)" type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="70" />
          </div>
          <Button onClick={saveProfile} loading={profileLoading} className="w-full">
            {profileSuccess ? '✅ Profil mis à jour !' : 'Sauvegarder'}
          </Button>
        </CardContent>
      </Card>

      {/* Objectives */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mes objectifs</CardTitle>
            <Button size="sm" onClick={() => setShowObjective(true)}>
              <Plus size={14} /> Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {objectives.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">
              Aucun objectif. Ajoute-en un pour gagner des points bonus !
            </p>
          ) : (
            <div className="space-y-3">
              {objectives.map(obj => (
                <div key={obj.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {(obj.activity as any)?.emoji} {(obj.activity as any)?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {obj.target_count}× / {obj.period === 'daily' ? 'jour' : 'semaine'} · Multiplicateur ×{obj.multiplier}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="violet">×{obj.multiplier}</Badge>
                    <button onClick={() => removeObjective(obj.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle>Sécurité</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="8 caractères minimum"
          />
          <Button variant="secondary" onClick={changePassword} loading={pwLoading}>
            {pwSuccess ? '✅ Mot de passe changé !' : 'Changer le mot de passe'}
          </Button>
        </CardContent>
      </Card>

      {/* Objective modal */}
      <Modal open={showObjective} onClose={() => setShowObjective(false)} title="Ajouter un objectif">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Activité</label>
            <select
              value={objActivity}
              onChange={e => setObjActivity(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500"
            >
              <option value="">Choisir une activité...</option>
              {activities.filter(a => a.type === 'positive' || a.type === 'bonus').map(a => (
                <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Objectif (nombre de fois)" type="number" value={objCount} onChange={e => setObjCount(e.target.value)} min="1" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Par</label>
              <select
                value={objPeriod}
                onChange={e => setObjPeriod(e.target.value as 'daily' | 'weekly')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500"
              >
                <option value="daily">Jour</option>
                <option value="weekly">Semaine</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Multiplicateur de points (ex: 1.5 = +50%)</label>
            <select
              value={objMultiplier}
              onChange={e => setObjMultiplier(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500"
            >
              <option value="1.25">×1.25 (+25%)</option>
              <option value="1.5">×1.5 (+50%)</option>
              <option value="1.75">×1.75 (+75%)</option>
              <option value="2">×2 (+100%)</option>
            </select>
          </div>
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <p className="text-xs text-violet-400">
              Chaque fois que tu logges cette activité avec cet objectif actif, tu gagneras ×{objMultiplier} les points normaux.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowObjective(false)}>Annuler</Button>
            <Button className="flex-1" onClick={addObjective} loading={objLoading}>Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
