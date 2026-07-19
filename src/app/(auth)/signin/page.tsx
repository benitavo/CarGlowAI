'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, ArrowRight, Loader2, Lock, KeyRound } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { cn } from '@/lib/utils'

export default function SignInPage() {
  const router                  = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', { email, password, redirect: false })

    if (result?.error) {
      setError('Email ou mot de passe incorrect. Veuillez réessayer.')
      setLoading(false)
      return
    }

    router.push('/app')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-sage-500 mb-2">
          Bon retour parmi vous
        </div>
        <h1 className="font-display font-bold tracking-tight text-3xl xl:text-4xl leading-[1.1] text-midnight">
          Connexion à Verdia.
        </h1>
        <p className="text-midnight/50 mt-2 text-[15px]">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-sage-500 hover:text-sage-600 font-medium">Créer un compte</Link>
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Email */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[11px] font-semibold tracking-widest uppercase text-midnight/50">
              Mot de passe
            </label>
            <Link href="/forgot-password" className="text-[11px] text-midnight/35 hover:text-sage-500 transition-colors">
              Oublié ?
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-midnight/35 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-cream-50 border border-midnight/[0.10] rounded-xl pl-9 pr-3 py-2.5 text-base text-midnight placeholder:text-midnight/30 focus:outline-none focus:border-sage-400 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email}
          className={cn(
            'w-full rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold shadow-sage-sm transition-colors flex items-center justify-center gap-1.5 mt-1',
          )}
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            : <><span>Se connecter</span><ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
          }
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-midnight/[0.07] flex items-center justify-center gap-4 text-[11px] text-midnight/35">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3" strokeWidth={1.75} />
          Chiffrement SSL
        </span>
        <span>·</span>
        <span>Conforme RGPD</span>
        <span>·</span>
        <span>Données en France</span>
      </div>
    </div>
  )
}
