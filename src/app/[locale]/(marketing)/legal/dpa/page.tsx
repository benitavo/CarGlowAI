import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Accord de traitement des données',
  description: "Accord de traitement des données (DPA) de Verdia.",
}

export default function DpaPage() {
  return (
    <LegalPageLayout eyebrow="Protection des données" title="Accord de traitement des données (DPA)" updated="28 juillet 2026">
      <LegalSection n="1" title="Objet">
        <p>
          Le présent accord précise les conditions dans lesquelles Verdia traite, pour le compte de ses
          utilisateurs professionnels (« le client »), les données à caractère personnel contenues dans les
          photographies et informations transmises via la plateforme.
        </p>
        <p>Il complète les <Link href="/legal/terms" className="text-sage-600 underline underline-offset-2 hover:text-sage-700">conditions générales</Link> de Verdia et s&apos;applique dès l&apos;utilisation du service.</p>
      </LegalSection>

      <LegalSection n="2" title="Qualification des parties">
        <p>Pour les données que le client soumet à Verdia dans le cadre de son activité professionnelle (par exemple des photographies de jardins de ses propres clients), le client agit en tant que responsable de traitement et Verdia en tant que sous-traitant, au sens du RGPD.</p>
      </LegalSection>

      <LegalSection n="3" title="Nature et finalité du traitement">
        <p>Verdia traite les données uniquement afin de :</p>
        <ul>
          <li>générer les rendus, retouches et vidéos demandés par le client ;</li>
          <li>assurer le fonctionnement, la sécurité et le support du service ;</li>
          <li>répondre aux obligations légales applicables.</li>
        </ul>
      </LegalSection>

      <LegalSection n="4" title="Catégories de données concernées">
        <p>Les données traitées peuvent notamment comprendre :</p>
        <ul>
          <li>les photographies importées par le client ;</li>
          <li>les rendus, retouches et vidéos générés ;</li>
          <li>les informations de compte et de facturation du client.</li>
        </ul>
        <p>Verdia n&apos;a pas connaissance de l&apos;identité des personnes éventuellement visibles sur les photographies importées et ne procède à aucune identification.</p>
      </LegalSection>

      <LegalSection n="5" title="Sous-traitants ultérieurs">
        <p>Pour l&apos;exécution du service, Verdia fait appel aux sous-traitants ultérieurs suivants :</p>
        <ul>
          <li>Google Gemini, pour la génération de contenus par intelligence artificielle ;</li>
          <li>Stripe, pour le traitement des paiements ;</li>
          <li>des prestataires d&apos;hébergement et d&apos;infrastructure nécessaires au fonctionnement de la plateforme.</li>
        </ul>
        <p>Ces prestataires ne reçoivent que les données strictement nécessaires à l&apos;exécution de leur mission et sont tenus à des obligations de confidentialité et de sécurité équivalentes.</p>
      </LegalSection>

      <LegalSection n="6" title="Sécurité">
        <p>Verdia met en œuvre des mesures techniques et organisationnelles raisonnables pour protéger les données contre la perte, l&apos;accès non autorisé ou la divulgation, notamment le chiffrement des communications et le contrôle d&apos;accès aux données de production.</p>
      </LegalSection>

      <LegalSection n="7" title="Assistance au client">
        <p>Verdia assiste le client, dans une mesure raisonnable, dans le respect de ses propres obligations RGPD : réponse aux demandes d&apos;exercice des droits, notification des violations de données, et analyses d&apos;impact le cas échéant.</p>
      </LegalSection>

      <LegalSection n="8" title="Violation de données">
        <p>En cas de violation de données à caractère personnel affectant les données du client, Verdia en informe le client dans les meilleurs délais après en avoir pris connaissance.</p>
      </LegalSection>

      <LegalSection n="9" title="Durée et sort des données">
        <p>Les données sont conservées pendant la durée du compte du client, puis supprimées ou anonymisées dans un délai raisonnable après la résiliation, sauf obligation légale de conservation plus longue.</p>
      </LegalSection>

      <LegalSection n="10" title="Contact">
        <p>Pour toute question relative au présent accord ou à la protection de vos données, écrivez à <a href="mailto:verdia.rendus@gmail.com">verdia.rendus@gmail.com</a>. Voir également notre <Link href="/legal/privacy" className="text-sage-600 underline underline-offset-2 hover:text-sage-700">politique de confidentialité</Link>.</p>
      </LegalSection>
    </LegalPageLayout>
  )
}
