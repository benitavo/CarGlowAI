import type { Metadata } from 'next'
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: "Mentions légales de l'éditeur du site Verdia.",
}

export default function MentionsLegalesPage() {
  return (
    <LegalPageLayout eyebrow="Informations légales" title="Mentions légales" updated="17 juillet 2026">
      <LegalSection title="Éditeur">
        <p>Entreprise individuelle Verdia</p>
      </LegalSection>

      <LegalSection title="Adresse">
        <p>
          201 Rua Saraiva de Carvalho<br />
          1250-247 Lisbonne<br />
          Portugal
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p><a href="mailto:verdia.rendus@gmail.com">verdia.rendus@gmail.com</a></p>
      </LegalSection>
    </LegalPageLayout>
  )
}
