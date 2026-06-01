'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Mail, X, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { teamMembers, pendingInvites } from '@/lib/mock-data'

const ROLE_CLS = {
  Owner:  'bg-glow-500/15 text-glow-300 border-glow-500/30',
  Admin:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  Editor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Viewer: 'bg-white/[0.06] text-offwhite/60 border-white/15',
}

export default function TeamPage() {
  const [email, setEmail]               = useState('')
  const [sent, setSent]                 = useState(false)
  const [inviting, setInviting]         = useState(false)
  const [inviteError, setInviteError]   = useState<string | null>(null)
  const [workspaceId, setWorkspaceId]   = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState('your workspace')

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => {
        setWorkspaceId(d.workspaceId)
        setWorkspaceName(d.workspaceName)
      })
      .catch(() => {})
  }, [])

  async function invite() {
    if (!email || !workspaceId) return
    setInviting(true)
    setInviteError(null)

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, workspaceId }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Failed to send invite')
      }

      setSent(true)
      setEmail('')
      setTimeout(() => setSent(false), 4000)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="pb-24 lg:pb-12">
      <section className="border-b border-white/[0.04] bg-gradient-to-b from-glow-500/[0.025] to-transparent">
        <div className="px-6 lg:px-10 py-8 max-w-[800px]">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-glow-400/90 mb-2">Team</div>
          <h1 className="font-display font-bold text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1]">Your team.</h1>
          <p className="text-offwhite/55 mt-2 text-[15px]">{teamMembers.length} members on {workspaceName}</p>
        </div>
      </section>

      <div className="px-6 lg:px-10 py-8 max-w-[800px] space-y-6">

        {/* Invite */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
          <h2 className="font-display font-semibold text-base mb-4">Invite a teammate</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-offwhite/40 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && invite()}
                placeholder="colleague@dealership.com"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-offwhite/35 focus:outline-none focus:border-glow-500/50" />
            </div>
            <button onClick={invite} disabled={!email || inviting || !workspaceId}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-glow-500 hover:bg-glow-400 disabled:opacity-50 text-midnight font-semibold text-sm transition-all">
              {inviting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Plus className="w-4 h-4" strokeWidth={2.5} />
              }
              Invite
            </button>
          </div>
          {sent && <p className="text-sm text-glow-400 mt-2">Invite sent!</p>}
          {inviteError && <p className="text-sm text-rose-400 mt-2">{inviteError}</p>}
          <p className="text-xs text-offwhite/40 mt-2">New members get Editor role by default</p>
        </div>

        {/* Members */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <h2 className="font-display font-semibold text-sm">Members</h2>
          </div>
          {teamMembers.map((m, i) => (
            <div key={m.id} className={cn('flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02]', i < teamMembers.length - 1 && 'border-b border-white/[0.04]')}>
              <Image src={m.avatar} alt="" width={36} height={36} className="rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-offwhite">{m.name}</div>
                <div className="text-xs text-offwhite/45">{m.email}</div>
              </div>
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border', ROLE_CLS[m.role])}>
                {m.role}
              </span>
              <span className="text-xs text-offwhite/35 hidden sm:block">{m.lastActive}</span>
            </div>
          ))}
        </div>

        {/* Pending */}
        {pendingInvites.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <h2 className="font-display font-semibold text-sm">Pending invites</h2>
            </div>
            {pendingInvites.map((inv, i) => (
              <div key={inv.id} className={cn('flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02]', i < pendingInvites.length - 1 && 'border-b border-white/[0.04]')}>
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-dashed border-white/15 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-offwhite/40" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-offwhite">{inv.email}</div>
                  <div className="text-xs text-offwhite/40">Invited {inv.sentAt}</div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-sky-500/15 text-sky-300 border-sky-500/30">{inv.role}</span>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-offwhite/40 hover:text-offwhite hover:bg-white/[0.06]">
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
