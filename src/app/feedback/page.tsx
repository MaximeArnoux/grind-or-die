'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const FREQ = ['Tous les jours', 'Quelques fois par semaine', 'Rarement', 'Presque jamais']
const RAISONS = ['J\'ai oublié', 'Flemme de tout rentrer', 'Pas eu le temps', 'Pas assez intéressant', 'Autre']
const MOMENTS = ['Le matin', 'Dans la journée', 'Le soir', 'Jamais spontanément']
const RAPPELS = ['Quand un pote me dépasse', 'Un rappel fixe le soir', 'Les deux', 'Aucun']
const RECO = ['Oui', 'Non', 'Peut-être']

export default function FeedbackPage() {
  const supabase = createClient()
  const [pseudo, setPseudo] = useState('')
  const [frequence, setFrequence] = useState('')
  const [raisons, setRaisons] = useState<string[]>([])
  const [moment, setMoment] = useState('')
  const [rappel, setRappel] = useState('')
  const [ouvrir, setOuvrir] = useState('')
  const [saoule, setSaoule] = useState('')
  const [ajout, setAjout] = useState('')
  const [note, setNote] = useState(0)
  const [recommande, setRecommande] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function toggleRaison(r: string) {
    setRaisons(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  async function submit() {
    setLoading(true)
    await supabase.from('feedback').insert({
      pseudo: pseudo || null,
      frequence: frequence || null,
      raisons: raisons.join(', ') || null,
      moment: moment || null,
      rappel: rappel || null,
      ouvrir: ouvrir || null,
      saoule: saoule || null,
      ajout: ajout || null,
      note: note || null,
      recommande: recommande || null,
    })
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h1 className="text-2xl font-black text-white mb-2">Merci !</h1>
          <p className="text-gray-400">Ton avis va vraiment aider à améliorer l&apos;app.</p>
        </div>
      </div>
    )
  }

  const Choice = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${value === o ? 'bg-violet-600 border-violet-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
        >
          {o}
        </button>
      ))}
    </div>
  )

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-white">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-5">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-gray-950 fill-gray-950" />
          </div>
          <span className="font-black text-xl text-white">GRIND <span className="text-gray-600 font-light">or</span> DIE</span>
        </div>

        <div>
          <h1 className="text-2xl font-black text-white">Ton avis 🔥</h1>
          <p className="text-sm text-gray-400 mt-1">2 min max, sois honnête — ça m&apos;aide énormément.</p>
        </div>

        <div className="space-y-6 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <Field label="Ton pseudo sur l'app ?">
            <Input value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="monpseudo" />
          </Field>

          <Field label="Tu reviens sur l'app…">
            <Choice options={FREQ} value={frequence} onChange={setFrequence} />
          </Field>

          <Field label="Pourquoi tu n'as pas rempli certains jours ?">
            <div className="flex flex-wrap gap-2">
              {RAISONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRaison(r)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${raisons.includes(r) ? 'bg-violet-600 border-violet-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>

          <Field label="À quel moment tu penses à logger ?">
            <Choice options={MOMENTS} value={moment} onChange={setMoment} />
          </Field>

          <Field label="Tu préfères quel rappel ?">
            <Choice options={RAPPELS} value={rappel} onChange={setRappel} />
          </Field>

          <Field label="Qu'est-ce qui te ferait ouvrir l'app sans rappel ?">
            <textarea value={ouvrir} onChange={e => setOuvrir(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none" placeholder="..." />
          </Field>

          <Field label="Qu'est-ce qui t'a saoulé ou était trop compliqué ?">
            <textarea value={saoule} onChange={e => setSaoule(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none" placeholder="..." />
          </Field>

          <Field label="Si tu pouvais ajouter UNE chose, ce serait quoi ?">
            <textarea value={ajout} onChange={e => setAjout(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none" placeholder="..." />
          </Field>

          <Field label="Note l'app sur 10">
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNote(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold border transition-colors ${note === n ? 'bg-violet-600 border-violet-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tu la recommanderais à un ami ?">
            <Choice options={RECO} value={recommande} onChange={setRecommande} />
          </Field>

          <Button onClick={submit} loading={loading} size="lg" className="w-full">
            Envoyer mon avis
          </Button>
        </div>
      </div>
    </div>
  )
}
