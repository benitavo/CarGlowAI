'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useConsent } from './ConsentProvider'

// CNIL requires "refuse" to be exactly as easy and visually prominent as "accept" — no
// dark pattern where accept is a bold brand-colored button and refuse is a faint link.
// All three actions below share the same size/weight; only "Personnaliser" is visually
// distinct (outline instead of solid), and it's still a full-size button, not a footnote.
const PRIMARY_BUTTON = 'px-5 py-3 rounded-xl bg-midnight text-white text-sm font-semibold hover:bg-midnight-800 transition-colors text-center'
const OUTLINE_BUTTON = 'px-5 py-3 rounded-xl border border-midnight/[0.15] text-midnight text-sm font-semibold hover:bg-midnight/[0.04] transition-colors text-center'

export function CookieBanner() {
  const { status, bannerOpen, categories, acceptAll, rejectAll, savePreferences } = useConsent()
  const [showDetails, setShowDetails] = useState(false)
  const [draftMarketing, setDraftMarketing] = useState(categories.marketing)

  useEffect(() => {
    if (bannerOpen) {
      setShowDetails(false)
      setDraftMarketing(categories.marketing)
    }
    // Only re-sync when the banner transitions open — not on every `categories` change,
    // otherwise the in-progress draft toggle would get overwritten while the panel is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerOpen])

  if (status === 'unknown' || !bannerOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Préférences de cookies"
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div
        className="mx-auto max-w-3xl rounded-3xl border border-midnight/[0.08] bg-white shadow-card-hover p-5 sm:p-6"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        {!showDetails ? (
          <>
            <p className="text-sm text-midnight/70 leading-relaxed mb-4">
              Nous utilisons des cookies nécessaires au fonctionnement de Verdia, ainsi que des
              cookies marketing (Meta/Facebook) — soumis à votre consentement — pour mesurer
              l&apos;efficacité de nos publicités ; ceux-ci impliquent un transfert de données à
              Meta. Voir notre{' '}
              <Link href="/legal/cookies" className="underline hover:text-midnight">
                politique de cookies
              </Link>{' '}
              et notre{' '}
              <Link href="/legal/privacy" className="underline hover:text-midnight">
                politique de confidentialité
              </Link>
              .
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button onClick={rejectAll} className={PRIMARY_BUTTON}>Tout refuser</button>
              <button onClick={() => setShowDetails(true)} className={OUTLINE_BUTTON}>Personnaliser</button>
              <button onClick={acceptAll} className={PRIMARY_BUTTON}>Tout accepter</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display font-semibold text-midnight text-base mb-1">
              Personnaliser mes préférences
            </h2>
            <p className="text-xs text-midnight/45 mb-4">
              Choisissez les cookies que vous acceptez, catégorie par catégorie.
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-cream-50 border border-midnight/[0.06]">
                <div>
                  <p className="text-sm font-semibold text-midnight">Nécessaires</p>
                  <p className="text-xs text-midnight/50 mt-0.5">
                    Indispensables au fonctionnement du site (connexion, sécurité). Toujours actifs.
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-midnight/40 px-2.5 py-1 rounded-full bg-midnight/[0.06] whitespace-nowrap">
                  Toujours actif
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-cream-50 border border-midnight/[0.06]">
                <div>
                  <p className="text-sm font-semibold text-midnight">Marketing</p>
                  <p className="text-xs text-midnight/50 mt-0.5">
                    Meta (Facebook) Pixel — mesure de l&apos;efficacité publicitaire. Implique un
                    transfert de données à Meta.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draftMarketing}
                  aria-label="Autoriser les cookies marketing"
                  onClick={() => setDraftMarketing(v => !v)}
                  className={cn(
                    'shrink-0 w-11 h-6 rounded-full transition-colors relative',
                    draftMarketing ? 'bg-sage-500' : 'bg-midnight/15',
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                    draftMarketing ? 'translate-x-5' : 'translate-x-0.5',
                  )} />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button onClick={() => setShowDetails(false)} className={OUTLINE_BUTTON}>Retour</button>
              <button
                onClick={() => savePreferences({ marketing: draftMarketing })}
                className="flex-1 px-5 py-3 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-semibold transition-colors text-center"
              >
                Enregistrer mes choix
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
