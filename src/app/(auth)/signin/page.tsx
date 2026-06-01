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

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    router.push('/app')
    router.refresh()  // ensure server components re-read session
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">
          Welcome back
        </div>
        <h1 className="font-display font-bold tracking-tight text-3xl xl:text-4xl leading-[1.1]">
          Sign in to CarGlow.
        </h1>
        <p className="text-offwhite/55 mt-2 text-[15px]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-glow-400 hover:text-glow-300">Create one</Link>
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[11px] font-semibold tracking-widest uppercase text-offwhite/55">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-offwhite/40 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@dealership.com"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-offwhite/35 focus:outline-none focus:border-glow-500/50 focus:bg-white/[0.05] transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[11px] font-semibold tracking-widest uppercase text-offwhite/55">
              Password
            </label>
            <Link href="/forgot-password" className="text-[11px] text-offwhite/40 hover:text-glow-400 transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-offwhite/40 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-offwhite/35 focus:outline-none focus:border-glow-500/50 focus:bg-white/[0.05] transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email}
          className={cn(
            'w-full rounded-lg bg-glow-500 hover:bg-glow-400 disabled:opacity-60 disabled:cursor-not-allowed text-midnight px-4 py-2.5 text-sm font-semibold shadow-glow-md transition-colors flex items-center justify-center gap-1.5',
          )}
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            : <><span>Sign in</span><ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
          }
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/[0.05] flex items-center justify-center gap-4 text-[11px] text-offwhite/40">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3" strokeWidth={1.75} />
          SOC 2 Type II
        </span>
        <span>·</span>
        <span>GDPR compliant</span>
        <span>·</span>
        <span>EU data residency</span>
      </div>
    </div>
  )
}
