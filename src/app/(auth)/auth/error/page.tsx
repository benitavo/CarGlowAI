'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, LifeBuoy } from 'lucide-react'

const ERROR_META: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server configuration error',
    description: 'Our sign-in service is misconfigured. We&apos;ve been notified — please try again in a few minutes.',
  },
  AccessDenied: {
    title: 'Access denied',
    description: 'Your account doesn&apos;t have permission to sign in. Contact your workspace admin.',
  },
  Verification: {
    title: 'Link expired',
    description: 'This sign-in link has expired or already been used. Request a new one to continue.',
  },
  OAuthSignin: {
    title: 'Provider sign-in failed',
    description: 'We couldn&apos;t connect to the sign-in provider. Try again, or use email instead.',
  },
  OAuthCallback: {
    title: 'Sign-in interrupted',
    description: 'The sign-in flow was interrupted before it finished. Try again.',
  },
  OAuthAccountNotLinked: {
    title: 'Account already exists',
    description: 'An account with this email exists with a different sign-in method. Use the original method to sign in.',
  },
  EmailSignin: {
    title: 'Couldn&apos;t send email',
    description: 'We couldn&apos;t deliver the sign-in email. Check the address and try again.',
  },
  CredentialsSignin: {
    title: 'Wrong email or password',
    description: 'The credentials you entered don&apos;t match an account. Try again, or reset your password.',
  },
  SessionRequired: {
    title: 'Please sign in',
    description: 'You need to be signed in to view that page.',
  },
  Default: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred during sign-in. Please try again.',
  },
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="text-center text-offwhite/55">Loading…</div>}>
      <ErrorContent />
    </Suspense>
  )
}

function ErrorContent() {
  const params = useSearchParams()
  const errorKey = params.get('error') ?? 'Default'
  const meta = ERROR_META[errorKey] ?? ERROR_META.Default

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 mb-6">
        <AlertTriangle className="w-7 h-7 text-rose-300" strokeWidth={1.5} />
      </div>

      <h1 className="font-display font-bold tracking-tight text-3xl xl:text-4xl leading-[1.1]">
        {meta.title}
      </h1>
      <p
        className="text-offwhite/65 mt-3 text-[15px] max-w-sm mx-auto"
        dangerouslySetInnerHTML={{ __html: meta.description }}
      />

      <div className="mt-2 text-[11px] uppercase tracking-widest text-offwhite/35 font-mono">
        Code: {errorKey}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Link
          href="/signin"
          className="rounded-lg bg-glow-500 hover:bg-glow-400 text-midnight px-4 py-2.5 text-sm font-semibold shadow-glow-md inline-flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Back to sign in
        </Link>
        <Link
          href="/support"
          className="text-xs text-offwhite/55 hover:text-offwhite py-2 inline-flex items-center justify-center gap-1.5"
        >
          <LifeBuoy className="w-3.5 h-3.5" strokeWidth={1.75} />
          Contact support
        </Link>
      </div>
    </div>
  )
}
