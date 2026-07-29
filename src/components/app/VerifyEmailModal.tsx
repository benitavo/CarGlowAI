'use client'

import { useState } from 'react'
import { Mail, X, Loader2, RefreshCw } from 'lucide-react'

// Shown whenever an unverified account clicks something past its one free action (a 2nd
// generation, a retouch, a marketing-kit export — each of those routes returns
// `email_not_verified`). Mirrors InsufficientCreditsModal's visual language so both
// "you're blocked" moments feel like the same product, just a different reason why.
export function VerifyEmailModal({ onClose }: { onClose: () => void }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const resend = async () => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Erreur inconnue')
      } else {
        setSent(true)
      }
    } catch {
      setError('Erreur inconnue')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-midnight/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white border border-amber-100 rounded-2xl w-full max-w-sm p-6 pointer-events-auto shadow-card text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded hover:bg-sage-50 text-midnight/40"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-amber-500" strokeWidth={1.75} />
          </div>
          <h3 className="font-display font-semibold text-lg text-midnight mb-2">
            Vérifiez votre e-mail pour continuer
          </h3>
          <p className="text-sm text-midnight/50 mb-6">
            {sent
              ? 'E-mail envoyé — pensez à vérifier vos spams.'
              : 'Vous avez utilisé votre premier rendu gratuit. Vérifiez votre adresse pour continuer à générer, retoucher, ou créer du contenu marketing.'}
          </p>
          <div className="flex flex-col gap-2">
            {!sent && (
              <button
                onClick={resend}
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Renvoyer l&apos;e-mail de vérification
              </button>
            )}
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button onClick={onClose} className="text-sm text-midnight/40 hover:text-midnight/60 py-1">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
