'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { KeyRound, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const params   = useSearchParams()
  const router   = useRouter()
  const token    = params.get('token') ?? ''
  const email    = params.get('email') ?? ''

  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const mismatch  = password2.length > 0 && password !== password2
  const tooShort  = password.length > 0 && password.length < 8
  const canSubmit = password.length >= 8 && password === password2 && !!token && !!email

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur inconnue'); return }
      setDone(true)
      setTimeout(() => router.push('/signin'), 2500)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="font-display font-bold text-2xl text-midnight mb-2">Lien invalide</h1>
        <p className="text-midnight/50 text-[15px] mb-6">Ce lien est invalide ou a expiré.</p>
        <Link href="/forgot-password" className="text-sm text-sage-600 hover:text-sage-700 font-medium">
          Demander un nouveau lien →
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-sage-500 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="font-display font-bold text-2xl text-midnight mb-2">Mot de passe mis à jour !</h1>
        <p className="text-midnight/50 text-[15px]">Vous allez être redirigé vers la connexion…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-500 mb-2">
          Nouveau mot de passe
        </div>
        <h1 className="font-display font-bold tracking-tight text-3xl xl:text-4xl leading-[1.1] text-midnight">
          Choisissez un<br />nouveau mot de passe.
        </h1>
        <p className="text-midnight/50 mt-2 text-[15px]">
          Pour le compte <strong>{email}</strong>.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[11px] font-semibold tracking-widest uppercase text-midnight/50">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-midnight/35 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              className="w-full bg-cream-50 border border-midnight/[0.10] rounded-xl pl-9 pr-3 py-2.5 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:bg-white transition-colors"
            />
          </div>
          {tooShort && <p className="text-[11px] text-rose-500">Au moins 8 caractères requis.</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password2" className="text-[11px] font-semibold tracking-widest uppercase text-midnight/50">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-midnight/35 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              id="password2"
              type="password"
              required
              autoComplete="new-password"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-cream-50 border border-midnight/[0.10] rounded-xl pl-9 pr-3 py-2.5 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:bg-white transition-colors"
            />
          </div>
          {mismatch && <p className="text-[11px] text-rose-500">Les mots de passe ne correspondent pas.</p>}
        </div>

        {error && (
          <p className="text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            {error}{' '}
            {error.includes('expiré') && (
              <Link href="/forgot-password" className="underline">Demander un nouveau lien</Link>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold shadow-sage-sm transition-colors flex items-center justify-center gap-1.5 mt-1"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            : <><span>Enregistrer le mot de passe</span><ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
          }
        </button>
      </form>
    </div>
  )
}
