'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, User, KeyRound, ArrowRight, Check, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { cn } from '@/lib/utils'

const BENEFITS = [
  '3 free photos, no card required',
  'Cancel anytime, keep your photos',
  'GDPR-compliant, EU data residency',
]

// Password rules — kept simple but enforced both client- and server-side
function validatePassword(pwd: string): string | null {
  if (pwd.length < 8)              return 'Password must be at least 8 characters.'
  if (pwd.length > 200)            return 'Password is too long.'
  if (!/[A-Za-z]/.test(pwd))       return 'Password must contain at least one letter.'
  if (!/\d/.test(pwd))             return 'Password must contain at least one number.'
  return null
}

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const pwdError = password.length > 0 ? validatePassword(password) : null
  const valid    = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && !validatePassword(password)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    setError(null)

    try {
      // Step 1: register the account
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name.trim() }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Could not create account.')
        setLoading(false)
        return
      }

      // Step 2: sign in to issue the session JWT
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError('Account created — please sign in.')
        setLoading(false)
        router.push('/signin')
        return
      }

      router.push('/app')
      router.refresh()

    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">
          Start free
        </div>
        <h1 className="font-display font-bold tracking-tight text-3xl xl:text-4xl leading-[1.1]">
          Create your account.
        </h1>
        <p className="text-offwhite/55 mt-2 text-[15px]">
          Already with us?{' '}
          <Link href="/signin" className="text-glow-400 hover:text-glow-300">Sign in</Link>
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" icon={User}>
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Marcus Hill"
            className="auth-input"
          />
        </Field>

        <Field label="Email" icon={Mail}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@dealership.com"
            className="auth-input"
          />
        </Field>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold tracking-widest uppercase text-offwhite/55">Password</label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-offwhite/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="auth-input"
            />
          </div>
          {pwdError && <p className="text-[11px] text-rose-400">{pwdError}</p>}
          {!pwdError && password.length >= 8 && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" strokeWidth={3} /> Looks good
            </p>
          )}
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !valid}
          className={cn(
            'w-full rounded-lg bg-glow-500 hover:bg-glow-400 disabled:opacity-60 disabled:cursor-not-allowed text-midnight px-4 py-2.5 text-sm font-semibold shadow-glow-md transition-colors flex items-center justify-center gap-1.5 mt-2',
          )}
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            : <><span>Create account</span><ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
          }
        </button>

        <p className="text-[11px] text-offwhite/45 text-center leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-offwhite/65 underline-offset-2 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-offwhite/65 underline-offset-2 hover:underline">Privacy Policy</Link>.
        </p>
      </form>

      <ul className="mt-8 pt-6 border-t border-white/[0.05] space-y-2">
        {BENEFITS.map(b => (
          <li key={b} className="flex items-center gap-2 text-xs text-offwhite/65">
            <Check className="w-3.5 h-3.5 text-glow-400 flex-shrink-0" strokeWidth={2.5} />
            {b}
          </li>
        ))}
      </ul>

      <style jsx global>{`
        .auth-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem 0.625rem 2.25rem;
          font-size: 0.875rem;
          color: inherit;
          transition: border-color 0.15s, background 0.15s;
        }
        .auth-input::placeholder { color: rgba(247, 245, 241, 0.35); }
        .auth-input:focus {
          outline: none;
          border-color: rgba(255, 138, 61, 0.5);
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  )
}

function Field({
  label, icon: Icon, optional, children,
}: { label: string; icon: typeof Mail; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold tracking-widest uppercase text-offwhite/55">{label}</label>
        {optional && <span className="text-[10px] text-offwhite/40 uppercase tracking-wider">Optional</span>}
      </div>
      <div className="relative">
        <Icon className="w-4 h-4 text-offwhite/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
        {children}
      </div>
    </div>
  )
}
