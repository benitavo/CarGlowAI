'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Mail, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

function CheckEmailContent() {
  const params  = useSearchParams()
  const router  = useRouter()
  const error   = params.get('error')
  const [sent,     setSent]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [resendErr, setResendErr] = useState<string | null>(null)

  // A user on this page already has a session (just an unverified one) — a plain link to
  // /signin bounced them straight back here: the middleware sees an authenticated user on
  // a guest-only route and redirects to /app, whose layout sees the unverified email and
  // redirects right back to /check-email. Signing out first breaks that loop.
  const backToSignIn = async () => {
    setSigningOut(true)
    await signOut({ redirect: false })
    router.push('/signin')
  }

  const resend = async () => {
    setLoading(true)
    setResendErr(null)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        setResendErr(d.error ?? 'Erreur inconnue')
      } else {
        setSent(true)
      }
    } catch {
      setResendErr('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (error === 'expired') {
    return (
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="font-display font-bold text-2xl text-midnight mb-2">Lien expiré</h1>
        <p className="text-midnight/50 text-[15px] mb-6">
          Ce lien de vérification a expiré (valable 24h). Demandez-en un nouveau.
        </p>
        <button onClick={resend} disabled={loading || sent}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {sent ? 'Email envoyé !' : 'Renvoyer un lien'}
        </button>
      </div>
    )
  }

  if (error === 'invalid') {
    return (
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="font-display font-bold text-2xl text-midnight mb-2">Lien invalide</h1>
        <p className="text-midnight/50 text-[15px] mb-6">Ce lien n&apos;est pas valide.</p>
        <button onClick={resend} disabled={loading || sent}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {sent ? 'Email envoyé !' : 'Recevoir un nouveau lien'}
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-sage-50 border border-sage-200 flex items-center justify-center mx-auto mb-5">
        <Mail className="w-8 h-8 text-sage-500" strokeWidth={1.5} />
      </div>
      <h1 className="font-display font-bold text-2xl text-midnight mb-2">Vérifiez votre boîte mail</h1>
      <p className="text-midnight/50 text-[15px] leading-relaxed mb-8">
        Nous vous avons envoyé un email avec un lien de confirmation.<br />
        Cliquez dessus pour activer votre compte.
      </p>

      <div className="bg-cream-50 border border-sage-100 rounded-2xl p-5 mb-6 text-left">
        <p className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-2">À faire</p>
        <ol className="space-y-2 text-sm text-midnight/60">
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-sage-400 shrink-0" strokeWidth={2} /> Ouvrez votre boîte mail</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-sage-400 shrink-0" strokeWidth={2} /> Cherchez un email de <strong>noreply@verdia-app.com</strong></li>
          <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-sage-400 shrink-0" strokeWidth={2} /> Cliquez sur le bouton de confirmation</li>
        </ol>
      </div>

      {sent ? (
        <p className="text-sm text-sage-600 font-medium mb-3">✓ Nouvel email envoyé !</p>
      ) : (
        <button onClick={resend} disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-midnight/40 hover:text-sage-600 transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Renvoyer l&apos;email
        </button>
      )}

      {resendErr && <p className="text-xs text-rose-500 mt-2">{resendErr}</p>}

      <div className="mt-8 pt-6 border-t border-midnight/[0.07]">
        <button onClick={backToSignIn} disabled={signingOut}
          className="text-sm text-midnight/40 hover:text-sage-600 transition-colors disabled:opacity-60">
          ← Retour à la connexion
        </button>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="text-midnight/40 text-sm text-center">Chargement…</div>}>
      <CheckEmailContent />
    </Suspense>
  )
}
