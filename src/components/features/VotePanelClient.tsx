'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import { submitVote } from '@/app/(app)/parametres/actions'

interface Vote {
  vote: string
  comment: string | null
  voter_id: string
}

interface PendingVote {
  id: string
  target_count: number
  period: 'daily' | 'weekly'
  multiplier: number
  created_at: string
  requester: { username: string; avatar_url: string | null } | null
  group: { name: string } | null
  activity: { name: string; emoji: string | null } | null
  votes: Vote[]
}

export function VotePanelClient({ pendingVotes }: { pendingVotes: PendingVote[] }) {
  const [index, setIndex] = useState(0)
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const current = pendingVotes[index]
  if (!current) return null

  const acceptCount = current.votes.filter(v => v.vote === 'accept').length
  const rejectCount = current.votes.filter(v => v.vote === 'reject').length

  async function handleVote(vote: 'accept' | 'reject') {
    setLoading(true)
    await submitVote(current.id, vote, comment)
    setComment('')
    setShowComment(false)
    setLoading(false)
    if (index > 0) setIndex(i => i - 1)
    router.refresh()
  }

  return (
    <div className="hidden lg:block fixed bottom-6 right-6 z-40 w-80">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-violet-600/10 border-b border-violet-500/20 flex items-center justify-between">
          <span className="text-sm font-bold text-violet-400">🗳️ Vote en cours</span>
          {pendingVotes.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIndex(i => Math.max(0, i - 1))}
                disabled={index === 0}
                className="p-1 rounded hover:bg-gray-800 text-gray-500 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-500 tabular-nums">{index + 1}/{pendingVotes.length}</span>
              <button
                onClick={() => setIndex(i => Math.min(pendingVotes.length - 1, i + 1))}
                disabled={index === pendingVotes.length - 1}
                className="p-1 rounded hover:bg-gray-800 text-gray-500 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Info */}
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-white">{current.requester?.username ?? '?'}</span>
            {' '}veut un objectif dans{' '}
            <span className="font-semibold text-white">{current.group?.name ?? '?'}</span>
          </p>

          {/* Activity card */}
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
            <span className="text-2xl">{current.activity?.emoji ?? '⚡'}</span>
            <div>
              <p className="text-sm font-bold text-white">{current.activity?.name ?? '?'}</p>
              <p className="text-xs text-gray-500">
                {current.target_count}× / {current.period === 'daily' ? 'jour' : 'semaine'} · ×{current.multiplier}
              </p>
            </div>
          </div>

          {/* Existing votes */}
          {(acceptCount > 0 || rejectCount > 0) && (
            <div className="flex gap-4 text-xs">
              <span className="text-green-400 font-medium">✓ {acceptCount} pour</span>
              <span className="text-red-400 font-medium">✗ {rejectCount} contre</span>
            </div>
          )}

          {/* Optional comment */}
          {showComment && (
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Ajouter un commentaire (optionnel)..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
            />
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComment(v => !v)}
              title="Ajouter un commentaire"
              className={`p-2 rounded-xl transition-colors ${showComment ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 text-gray-500 hover:text-gray-300'}`}
            >
              <MessageSquare size={15} />
            </button>
            <button
              onClick={() => handleVote('reject')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <X size={15} /> Refuser
            </button>
            <button
              onClick={() => handleVote('accept')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Check size={15} /> Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
