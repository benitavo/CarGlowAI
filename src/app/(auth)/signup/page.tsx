'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, User, KeyRound, ArrowRight, Check, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { cn } from '@/lib/utils'

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8)        return 'Le mot de passe doit contenir au moins 8 caractères.'
  if (pwd.length > 200)      return 'Le mot de passe est trop long.'
  if (!/[A-Za-z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une lettre.'
  if (!/\d/.test(pwd))       return 'Le mot de passe doit contenir au moins un chiffre.'
  return null
}

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [freeCredits, setFreeCredits] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/pricing')
      .then(r => r.json())
      .then(d => setFreeCredits(d.plans?.find((p: { id: string }) => p.id === 'FREE')?.credits ?? null))
      .catch(() => {})
  }, [])

  const benefits = [
    freeCredits
      ? `${freeCredits} crédit${freeCredits === 1 ? '' : 's'} offert${freeCredits === 1 ? '' : 's'} chaque mois, sans carte bancaire`
      : 'Crédits gratuits chaque mois, sans carte bancaire',
    'Résiliation à tout moment',
    'Conforme RGPD · Données hébergées en France',
  ]

  const pwdError = password.length > 0 ? validatePassword(password) : null
  const valid    = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && !validatePassword(password)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name.trim() }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Impossible de créer le compte.')
        setLoading(false)
        return
      }

      const signInResult = await signIn('credentials', { email, password, redirect: false })
      if (signInResult?.error) {
        setError('Compte créé — veuillez vous connecter.')
        setLoading(false)
        router.push('/signin')
        return
      }

      router.push('/app')
      router.refresh()
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-500 mb-2">
          Essai gratuit
        </div>
        <h1 className="font-display font-bold tracking-tight text-3xl xl:text-4xl leading-[1.1] text-midnight">
          Créer votre compte.
        </h1>
        <p className="text-midnight/50 mt-2 text-[15px]">
          Déjà membre ?{' '}
          <Link href="/signin" className="text-sage-500 hover:text-sage-600 font-medium">Se connecter</Link>
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom complet" icon={User}>
          <input type="text" required autoComplete="name" value={name}
            onChange={e => setName(e.target.value)} placeholder="Thomas Bernard" className="auth-input" />
        </Field>

        <Field label="Email" icon={Mail}>
          <input type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.fr" className="auth-input" />
        </Field>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold tracking-widest uppercase text-midnight/50">Mot de passe</label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-midnight/35 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
            <input type="password" required autoComplete="new-password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum" className="auth-input" />
          </div>
          {pwdError && <p className="text-[11px] text-rose-500">{pwdError}</p>}
          {!pwdError && password.length >= 8 && (
            <p className="text-[11px] text-sage-600 flex items-center gap-1">
              <Check className="w-3 h-3" strokeWidth={3} /> Parfait
            </p>
          )}
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button type="submit" disabled={loading || !valid}
          className={cn(
            'w-full rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold shadow-sage-sm transition-colors flex items-center justify-center gap-1.5 mt-2',
          )}>
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            : <><span>Créer mon compte</span><ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
          }
        </button>

        <p className="text-[11px] text-midnight/40 text-center leading-relaxed">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/terms" className="text-midnight/60 underline-offset-2 hover:underline">CGU</Link>
          {' '}et notre{' '}
          <Link href="/privacy" className="text-midnight/60 underline-offset-2 hover:underline">Politique de confidentialité</Link>.
        </p>
      </form>

      <ul className="mt-8 pt-6 border-t border-midnight/[0.07] space-y-2">
        {benefits.map(b => (
          <li key={b} className="flex items-center gap-2 text-xs text-midnight/55">
            <Check className="w-3.5 h-3.5 text-sage-500 flex-shrink-0" strokeWidth={2.5} />
            {b}
          </li>
        ))}
      </ul>

      <style jsx global>{`
        .auth-input {
          width: 100%;
          background: #F3FAF0;
          border: 1px solid rgba(13, 31, 17, 0.10);
          border-radius: 0.75rem;
          padding: 0.625rem 0.75rem 0.625rem 2.25rem;
          font-size: 0.875rem;
          color: #0D1F11;
          transition: border-color 0.15s, background 0.15s;
        }
        .auth-input::placeholder { color: rgba(13, 31, 17, 0.30); }
        .auth-input:focus {
          outline: none;
          border-color: rgba(82, 183, 136, 0.50);
          background: #FFFFFF;
        }
      `}</style>
    </div>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold tracking-widest uppercase text-midnight/50">{label}</label>
      <div className="relative">
        <Icon className="w-4 h-4 text-midnight/35 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
        {children}
      </div>
    </div>
  )
}
