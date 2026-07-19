'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      setDone(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-sage-500 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="font-display font-bold text-2xl text-midnight mb-2">Email envoyé !</h1>
        <p className="text-midnight/50 text-[15px] leading-relaxed mb-6">
          Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien dans quelques minutes.
        </p>
        <p className="text-sm text-midnight/40">Vérifiez aussi vos spams.</p>
        <Link href="/signin" className="mt-8 inline-flex items-center gap-1.5 text-sm text-sage-600 hover:text-sage-700 font-medium">
          ← Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-500 mb-2">
          Mot de passe oublié
        </div>
        <h1 className="font-display font-bold tracking-tight text-3xl xl:text-4xl leading-[1.1] text-midnight">
          Réinitialiser<br />votre mot de passe.
        </h1>
        <p className="text-midnight/50 mt-2 text-[15px]">
          Entrez votre email et nous vous enverrons un lien de réinitialisation.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[11px] font-semibold tracking-widest uppercase text-midnight/50">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-midnight/35 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              className="w-full bg-cream-50 border border-midnight/[0.10] rounded-xl pl-9 pr-3 py-2.5 text-base text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold shadow-sage-sm transition-colors flex items-center justify-center gap-1.5 mt-1"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            : <><span>Envoyer le lien</span><ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
          }
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/signin" className="text-sm text-midnight/40 hover:text-sage-600 transition-colors">
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
