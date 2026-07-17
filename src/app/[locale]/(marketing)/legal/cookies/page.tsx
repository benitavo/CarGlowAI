import type { Metadata } from 'next'
import { Link } from '@/i18n/routing'
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description: 'Quels cookies Verdia utilise et pourquoi.',
}

export default function CookiesPage() {
  return (
    <LegalPageLayout eyebrow="Cookies" title="Politique de cookies" updated="17 juillet 2026">
      <LegalSection title="Résumé">
        <p>
          Le site utilise des cookies techniques indispensables à son fonctionnement ainsi que, le cas échéant,
          des cookies de mesure d&apos;audience. Les cookies non essentiels sont soumis au consentement préalable
          lorsque la loi l&apos;exige.
        </p>
      </LegalSection>

      <LegalSection title="Pourquoi nous utilisons des cookies">
        <p>Verdia utilise des cookies afin :</p>
        <ul>
          <li>d&apos;assurer le fonctionnement du site ;</li>
          <li>de maintenir la session utilisateur ;</li>
          <li>de mesurer l&apos;audience ;</li>
          <li>d&apos;améliorer le service.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos choix">
        <p>
          Les cookies strictement nécessaires au fonctionnement du site (par exemple, le maintien de votre
          session de connexion) ne requièrent pas de consentement. Les cookies non essentiels — mesure
          d&apos;audience notamment — sont soumis à votre consentement préalable lorsque la réglementation
          l&apos;exige, et vous pouvez à tout moment les refuser ou les supprimer via les paramètres de votre
          navigateur.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question, écrivez à <a href="mailto:verdia.rendus@gmail.com">verdia.rendus@gmail.com</a>.
          Voir aussi notre <Link href="/legal/privacy" className="text-sage-600 underline underline-offset-2 hover:text-sage-700">politique de confidentialité</Link>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
