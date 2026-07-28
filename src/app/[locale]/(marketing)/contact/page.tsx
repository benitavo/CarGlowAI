'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

function ContactForm() {
  const params = useSearchParams()
  const isEnterprise = params.get('type') === 'enterprise'

  const [prenom,  setPrenom]  = useState('')
  const [nom,     setNom]     = useState('')
  const [email,   setEmail]   = useState('')
  const [sujet,   setSujet]   = useState(isEnterprise ? 'Demande commerciale' : '')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState<Status>('idle')
  const [errMsg,  setErrMsg]  = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prenom, nom, email, sujet, message }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Erreur inconnue')
      }
      setStatus('success')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Erreur inconnue')
      setStatus('error')
    }
  }

  const inputCls = 'w-full bg-cream-50 border border-sage-200 rounded-xl px-4 py-3 text-base text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100 transition-all'
  const labelCls = 'text-xs font-semibold text-midnight/50 uppercase tracking-widest mb-1.5 block'

  return (
    <div className="min-h-screen bg-white">
      <div className="page-container max-w-2xl py-32">

        <p className="eyebrow mb-3">Contact</p>
        <h1 className="font-display font-bold text-midnight mb-3" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>
          Une question ?<br /><span className="text-gradient">Écrivez-nous.</span>
        </h1>
        <p className="text-midnight/50 text-[15px] leading-relaxed mb-10">
          Demande commerciale, support technique ou partenariat — nous répondons sous 24h.
        </p>

        {status === 'success' ? (
          <div className="rounded-3xl border border-sage-200 bg-sage-50 p-10 text-center">
            <CheckCircle className="w-12 h-12 text-sage-500 mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="font-display font-semibold text-xl text-midnight mb-2">Message envoyé !</h2>
            <p className="text-midnight/50 text-sm">Nous vous répondrons dans les 24h.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Prénom *</label>
                <input required value={prenom} onChange={e => setPrenom(e.target.value)}
                  className={inputCls} placeholder="Antoine" />
              </div>
              <div>
                <label className={labelCls}>Nom</label>
                <input value={nom} onChange={e => setNom(e.target.value)}
                  className={inputCls} placeholder="Dupont" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Email *</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={inputCls} placeholder="vous@exemple.com" />
            </div>

            <div>
              <label className={labelCls}>Sujet</label>
              <select value={sujet} onChange={e => setSujet(e.target.value)} className={inputCls}>
                <option value="">Choisissez un sujet…</option>
                <option>Demande commerciale</option>
                <option>Support technique</option>
                <option>Partenariat</option>
                <option>Presse & médias</option>
                <option>Autre</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Message *</label>
              <textarea required rows={5} value={message} onChange={e => setMessage(e.target.value)}
                className={inputCls + ' resize-none'}
                placeholder="Décrivez votre demande…" />
            </div>

            {status === 'error' && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {errMsg}
              </p>
            )}

            <button type="submit" disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white font-semibold text-sm shadow-sage-sm hover:shadow-sage-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {status === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
              ) : (
                <>Envoyer le message <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactForm />
    </Suspense>
  )
}
