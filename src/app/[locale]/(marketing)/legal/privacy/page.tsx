import type { Metadata } from 'next'
import { Link } from '@/i18n/routing'
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment Verdia collecte, utilise et protège vos données personnelles et celles de vos clients.',
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout eyebrow="Confidentialité" title="Politique de confidentialité" updated="17 juillet 2026">
      <LegalSection title="Résumé">
        <p>
          En utilisant Verdia, l&apos;utilisateur accepte que les données strictement nécessaires au
          fonctionnement de la plateforme soient traitées afin :
        </p>
        <ul>
          <li>de créer le compte ;</li>
          <li>de générer les rendus ;</li>
          <li>de gérer les abonnements ;</li>
          <li>d&apos;assurer le support ;</li>
          <li>d&apos;améliorer le service.</li>
        </ul>
        <p><strong className="text-midnight/80 font-semibold">Verdia ne vend jamais les données personnelles de ses utilisateurs.</strong></p>
      </LegalSection>

      <LegalSection title="Quelles données sont collectées">
        <p>Verdia respecte le Règlement Général sur la Protection des Données (RGPD). Les données traitées peuvent comprendre notamment :</p>
        <ul>
          <li>nom ;</li>
          <li>adresse e-mail ;</li>
          <li>informations de connexion ;</li>
          <li>photographies importées ;</li>
          <li>historique des générations ;</li>
          <li>informations relatives aux abonnements.</li>
        </ul>
        <p>Les données bancaires sont exclusivement traitées par Stripe — Verdia n&apos;y a jamais accès.</p>
      </LegalSection>

      <LegalSection title="Utilisation de vos photos">
        <p>Les images envoyées par l&apos;utilisateur sont utilisées uniquement afin de produire les rendus demandés.</p>
        <p>Selon la fonctionnalité utilisée, elles peuvent être transmises de manière sécurisée à Google Gemini pour permettre la génération des contenus.</p>
        <p>Verdia ne revendique aucun droit de propriété sur les photographies importées, et ne les utilise ni pour entraîner des modèles d&apos;IA, ni pour toute autre finalité que la génération demandée.</p>
      </LegalSection>

      <LegalSection title="Prestataires">
        <p>Verdia utilise différents prestataires techniques, qui ne traitent que les données nécessaires à la fourniture du service :</p>
        <ul>
          <li>Google Gemini pour la génération de contenus IA ;</li>
          <li>Stripe pour les paiements ;</li>
          <li>les services d&apos;hébergement et d&apos;infrastructure nécessaires au fonctionnement de la plateforme.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>Les données sont conservées uniquement pendant la durée nécessaire :</p>
        <ul>
          <li>au fonctionnement du service ;</li>
          <li>au respect des obligations légales ;</li>
          <li>à la gestion de la relation client.</li>
        </ul>
        <p>À la fermeture d&apos;un compte, l&apos;utilisateur dispose de 30 jours pour exporter ses projets, après quoi les données sont supprimées, sauvegardes comprises.</p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>Conformément au RGPD, chaque utilisateur peut demander :</p>
        <ul>
          <li>l&apos;accès à ses données ;</li>
          <li>leur rectification ;</li>
          <li>leur suppression ;</li>
          <li>leur limitation ;</li>
          <li>leur portabilité ;</li>
          <li>ou s&apos;opposer à certains traitements.</li>
        </ul>
        <p>Toute demande peut être adressée à <a href="mailto:verdia.rendus@gmail.com">verdia.rendus@gmail.com</a>.</p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>Verdia met en œuvre des mesures techniques et organisationnelles raisonnables afin de protéger les données contre toute perte, accès non autorisé ou divulgation. Aucun système ne pouvant garantir une sécurité absolue, une protection totale contre tous les risques ne peut être garantie.</p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le site utilise des cookies techniques et de mesure d&apos;audience — voir notre{' '}
          <Link href="/legal/cookies" className="text-sage-600 underline underline-offset-2 hover:text-sage-700">politique de cookies</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question relative à vos données, écrivez à{' '}
          <a href="mailto:verdia.rendus@gmail.com">verdia.rendus@gmail.com</a>. Le détail contractuel complet
          figure dans nos <Link href="/legal/terms" className="text-sage-600 underline underline-offset-2 hover:text-sage-700">conditions générales</Link>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
