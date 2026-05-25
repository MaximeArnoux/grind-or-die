'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
  profile?: { username: string; avatar_url: string | null } | null
}

interface Props {
  groupId: string
  userId: string
  initialMessages: Message[]
}

export function GroupChatClient({ groupId, userId, initialMessages }: Props) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`chat_${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          const msg = payload.new as { id: string; user_id: string; content: string; created_at: string }
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, { ...msg, profile: null }]
          })
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', msg.user_id)
            .single()
          setMessages(prev =>
            prev.map(m => m.id === msg.id ? { ...m, profile } : m)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, supabase])

  async function sendMessage() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')
    await supabase.from('group_messages').insert({ group_id: groupId, user_id: userId, content })
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-8">Aucun message — soyez le premier !</p>
        )}
        {messages.map(msg => {
          const isMe = msg.user_id === userId
          const initial = (msg.profile?.username?.[0] ?? '?').toUpperCase()
          return (
            <div key={msg.id} className={cn('flex gap-2 items-end', isMe ? 'flex-row-reverse' : 'flex-row')}>
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0 mb-0.5">
                {msg.profile?.avatar_url
                  ? <img src={msg.profile.avatar_url} alt={initial} className="w-full h-full object-cover" />
                  : initial
                }
              </div>
              <div className={cn('flex flex-col gap-0.5 max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
                {!isMe && msg.profile?.username && (
                  <p className="text-[10px] text-gray-500 px-1">{msg.profile.username}</p>
                )}
                <div className={cn(
                  'px-3 py-2 text-sm break-words',
                  isMe
                    ? 'bg-violet-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm'
                )}>
                  {msg.content}
                </div>
                <p className="text-[10px] text-gray-600 px-1">
                  {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 px-3 py-2.5 flex gap-2 items-center flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          maxLength={500}
          className="flex-1 bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  )
}
