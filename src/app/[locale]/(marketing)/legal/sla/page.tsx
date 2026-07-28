import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Engagement de service',
  description: "Engagement de disponibilité et de support de Verdia.",
}

export default function SlaPage() {
  return (
    <LegalPageLayout eyebrow="Engagement de service" title="Engagement de disponibilité et de support" updated="28 juillet 2026">
      <LegalSection n="1" title="Disponibilité">
        <p>Verdia s&apos;efforce de maintenir une disponibilité élevée de la plateforme, sans garantie contractuelle de taux de disponibilité.</p>
        <p>Des interruptions peuvent survenir pour cause de maintenance planifiée, de mise à jour, d&apos;incident technique ou de force majeure. Verdia s&apos;efforce de limiter la durée de ces interruptions et, lorsque cela est possible, de les annoncer à l&apos;avance.</p>
      </LegalSection>

      <LegalSection n="2" title="Support">
        <p>Le support est disponible par e-mail à <a href="mailto:verdia.rendus@gmail.com">verdia.rendus@gmail.com</a> ou via le <Link href="/contact" className="text-sage-600 underline underline-offset-2 hover:text-sage-700">formulaire de contact</Link>.</p>
        <p>Verdia répond aux demandes dans un délai cible de 24 heures ouvrées, sans que ce délai constitue une garantie contractuelle.</p>
      </LegalSection>

      <LegalSection n="3" title="Incidents">
        <p>En cas d&apos;incident affectant significativement le service, Verdia s&apos;efforce d&apos;en informer les utilisateurs concernés et de rétablir le service dans les meilleurs délais.</p>
      </LegalSection>

      <LegalSection n="4" title="Limites">
        <p>Le présent engagement décrit un objectif de service et ne se substitue pas aux limitations de responsabilité prévues par les <Link href="/legal/terms" className="text-sage-600 underline underline-offset-2 hover:text-sage-700">conditions générales</Link> de Verdia.</p>
      </LegalSection>

      <LegalSection n="5" title="Contact">
        <p>Toute question relative à cet engagement peut être adressée à <a href="mailto:verdia.rendus@gmail.com">verdia.rendus@gmail.com</a>.</p>
      </LegalSection>
    </LegalPageLayout>
  )
}
