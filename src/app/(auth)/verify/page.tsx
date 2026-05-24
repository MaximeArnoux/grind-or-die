import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function VerifyPage() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail size={36} className="text-violet-400" />
      </div>
      <h2 className="text-3xl font-black text-white mb-3">Vérifie ton email 📬</h2>
      <p className="text-gray-400 mb-6 leading-relaxed">
        On t&apos;a envoyé un lien de confirmation.<br />
        Clique dessus pour activer ton compte et commencer à grinder.
      </p>
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-6 text-left">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-white">Pas reçu ?</span> Vérifie tes spams.
          Le lien expire dans 24h.
        </p>
      </div>
      <Link
        href="/login"
        className="text-sm text-violet-400 hover:text-violet-300 font-semibold"
      >
        ← Retour à la connexion
      </Link>
    </div>
  )
}
