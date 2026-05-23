'use client'

import { useState } from 'react'
import { Plus, Users, Copy, Check, LogIn, Crown, LogOut, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { createGroup, joinGroup, inviteByUsername, leaveGroup, deleteGroup } from '@/app/(app)/groupes/actions'

interface RankingMember {
  user_id: string
  username: string
  avatar_url: string | null
  points: number
  rank: number
  role: string
}

interface Group {
  id: string
  name: string
  description: string | null
  invite_code: string
  max_members: number
  role: string
  ranking: RankingMember[]
  members: unknown[]
}

type ConfirmAction = { type: 'leave' | 'delete'; group: Group } | null

export function GroupesClient({ groups, currentUserId }: { groups: Group[]; currentUserId: string }) {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmAction>(null)
  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteGroupId, setInviteGroupId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!groupName.trim()) return
    setLoading(true); setError('')
    const result = await createGroup(groupName.trim(), groupDesc.trim() || null)
    setLoading(false)
    if (result.error) { setError(result.error) } else { setShowCreate(false); setGroupName(''); setGroupDesc('') }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return
    setLoading(true); setError('')
    const result = await joinGroup(inviteCode)
    setLoading(false)
    if (result.error) { setError(result.error) } else { setShowJoin(false); setInviteCode('') }
  }

  async function handleInvite(groupId: string) {
    const username = inviteUsername.trim()
    if (!username) return
    setLoading(true); setError('')
    const result = await inviteByUsername(groupId, username)
    setLoading(false)
    if (result.error) { setError(result.error) } else { setInviteUsername(''); setInviteGroupId(null) }
  }

  async function handleConfirmAction() {
    if (!confirm) return
    setLoading(true); setError('')
    const result = confirm.type === 'leave'
      ? await leaveGroup(confirm.group.id)
      : await deleteGroup(confirm.group.id)
    setLoading(false)
    if (result.error) { setError(result.error) } else { setConfirm(null) }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const confirmTitle = confirm?.type === 'leave' ? 'Quitter le groupe ?' : 'Supprimer le groupe ?'
  const confirmDesc = confirm?.type === 'delete'
    ? `Le groupe "${confirm.group.name}" et tous ses membres seront définitivement supprimés.`
    : confirm?.group.role === 'admin' && confirm.group.members.length > 1
      ? `Tu es admin. En partant, un autre membre deviendra admin automatiquement.`
      : confirm?.group.role === 'admin' && confirm.group.members.length <= 1
        ? `Tu es le seul membre. Quitter supprimera définitivement le groupe.`
        : `Tu pourras rejoindre à nouveau avec un code d'invitation.`

  return (
    <>
      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => { setError(''); setShowCreate(true) }}>
          <Plus size={16} /> Créer un groupe
        </Button>
        <Button variant="outline" onClick={() => { setError(''); setShowJoin(true) }}>
          <LogIn size={16} /> Rejoindre
        </Button>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <Card className="py-16 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-700" />
          <p className="text-gray-400 font-semibold">Pas encore dans un groupe</p>
          <p className="text-sm text-gray-600 mt-2">Crée un groupe ou rejoins celui d&apos;un ami</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-black text-white">{group.name}</h2>
                      {group.role === 'admin' && <Badge variant="violet">Admin</Badge>}
                    </div>
                    {group.description && <p className="text-sm text-gray-500">{group.description}</p>}
                    <p className="text-xs text-gray-600 mt-1">{group.members.length}/{group.max_members} membres</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyCode(group.invite_code)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedCode === group.invite_code ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      {group.invite_code}
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Admin invite */}
                {group.role === 'admin' && (
                  <div className="mb-5 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        label="Inviter par pseudo"
                        value={inviteGroupId === group.id ? inviteUsername : ''}
                        onChange={e => { setInviteGroupId(group.id); setInviteUsername(e.target.value) }}
                        placeholder="nom_utilisateur"
                      />
                      <div className="sm:pt-7">
                        <Button onClick={() => handleInvite(group.id)} loading={loading && inviteGroupId === group.id}>
                          Inviter
                        </Button>
                      </div>
                    </div>
                    {error && inviteGroupId === group.id && (
                      <p className="text-sm text-red-400 mt-2">{error}</p>
                    )}
                  </div>
                )}

                {/* Weekly ranking */}
                {group.ranking.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Classement hebdo</p>

                    {/* Podium top 3 */}
                    <div className="flex items-end justify-center gap-6 mb-6">
                      {[group.ranking[1], group.ranking[0], group.ranking[2]].map((member, idx) => {
                        if (!member) return <div key={idx} className="w-20" />
                        const isFirst = member.rank === 1
                        const isMe = member.user_id === currentUserId
                        return (
                          <div key={member.user_id} className="flex flex-col items-center gap-1.5">
                            {isFirst && <Crown size={20} className="text-yellow-400" />}
                            <Link href={`/profil/${member.username}`} className="flex flex-col items-center gap-1.5 group">
                              <div className={cn(
                                'w-14 h-14 rounded-full flex items-center justify-center text-lg font-black border-3 overflow-hidden',
                                isFirst ? 'border-yellow-400 ring-2 ring-yellow-400/30' :
                                  member.rank === 2 ? 'border-gray-400' : 'border-amber-600',
                                isMe && 'ring-2 ring-violet-500/50'
                              )}>
                                {member.avatar_url
                                  ? <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                                  : member.username.charAt(0).toUpperCase()
                                }
                              </div>
                              <span className={cn('text-xs font-bold group-hover:underline', isMe ? 'text-violet-400' : 'text-white')}>{member.username}</span>
                            </Link>
                            <p className={cn('text-sm font-black', isFirst ? 'text-yellow-400' : 'text-white')}>
                              {member.points} pts
                            </p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Reste du classement */}
                    <div className="space-y-2">
                      {group.ranking.slice(3).map(member => (
                        <div
                          key={member.user_id}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-xl',
                            member.user_id === currentUserId ? 'bg-violet-600/10' : 'hover:bg-gray-800/30'
                          )}
                        >
                          <span className="text-sm font-bold text-gray-500 w-4 shrink-0">{member.rank}</span>
                          <Link href={`/profil/${member.username}`} className="flex items-center gap-2 flex-1 min-w-0 group">
                            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                              {member.avatar_url
                                ? <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                                : member.username.charAt(0).toUpperCase()
                              }
                            </div>
                            <span className="flex-1 text-sm text-white group-hover:underline">{member.username}</span>
                          </Link>
                          <span className="text-sm font-bold text-white">{member.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions quitter / supprimer */}
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800/50">
                  {group.role === 'admin' && (
                    <button
                      onClick={() => { setError(''); setConfirm({ type: 'delete', group }) }}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} /> Supprimer le groupe
                    </button>
                  )}
                  <button
                    onClick={() => { setError(''); setConfirm({ type: 'leave', group }) }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <LogOut size={13} /> Quitter le groupe
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer un groupe">
        <div className="space-y-4">
          <Input label="Nom du groupe" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Les Grinders" />
          <Input label="Description (optionnel)" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="On va tous devenir des machines" />
          <p className="text-xs text-gray-600">Maximum 10 membres. Un code d&apos;invitation sera généré automatiquement.</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button className="flex-1" onClick={handleCreate} loading={loading}>Créer</Button>
          </div>
        </div>
      </Modal>

      {/* Join modal */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Rejoindre un groupe">
        <div className="space-y-4">
          <Input
            label="Code d'invitation"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="ABC12345"
            className="uppercase tracking-widest font-mono"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowJoin(false)}>Annuler</Button>
            <Button className="flex-1" onClick={handleJoin} loading={loading}>Rejoindre</Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation leave / delete modal */}
      <Modal
        open={confirm !== null}
        onClose={() => { setConfirm(null); setError('') }}
        title={confirmTitle}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">{confirmDesc}</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setConfirm(null); setError('') }}>
              Annuler
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleConfirmAction}
              loading={loading}
            >
              {confirm?.type === 'leave' ? 'Quitter' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
