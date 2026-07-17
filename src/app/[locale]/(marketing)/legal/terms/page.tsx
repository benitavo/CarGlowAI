import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Conditions générales',
  description: "Conditions générales d'utilisation et de vente de Verdia.",
}

export default function TermsPage() {
  return (
    <LegalPageLayout eyebrow="Conditions générales" title="Conditions générales d'utilisation et de vente" updated="17 juillet 2026">
      <LegalSection n="1" title="Éditeur">
        <p>Verdia est exploité par une entreprise individuelle.</p>
        <p>
          <strong className="text-midnight/80 font-semibold">Adresse :</strong><br />
          201 Rua Saraiva de Carvalho<br />
          1250-247 Lisbonne<br />
          Portugal
        </p>
        <p>
          <strong className="text-midnight/80 font-semibold">Contact :</strong>{' '}
          <a href="mailto:verdia.rendus@gmail.com">verdia.rendus@gmail.com</a>
        </p>
      </LegalSection>

      <LegalSection n="2" title="Objet du service">
        <p>
          Verdia est une plateforme SaaS destinée aux professionnels du paysage permettant de générer, grâce à
          l&apos;intelligence artificielle, des rendus photoréalistes, des propositions d&apos;aménagement, des
          vidéos et d&apos;autres contenus visuels à partir de photographies fournies par l&apos;utilisateur.
        </p>
      </LegalSection>

      <LegalSection n="3" title="Acceptation">
        <p>L&apos;utilisation de Verdia implique l&apos;acceptation sans réserve des présentes conditions.</p>
        <p>Si l&apos;utilisateur n&apos;accepte pas ces conditions, il ne doit pas utiliser le service.</p>
      </LegalSection>

      <LegalSection n="4" title="Compte utilisateur">
        <p>L&apos;utilisateur est responsable :</p>
        <ul>
          <li>des informations communiquées lors de son inscription ;</li>
          <li>de la confidentialité de ses identifiants ;</li>
          <li>de toute activité réalisée depuis son compte.</li>
        </ul>
        <p>
          Verdia peut suspendre ou supprimer un compte en cas de fraude, d&apos;utilisation abusive, de tentative
          de piratage ou de violation des présentes conditions.
        </p>
      </LegalSection>

      <LegalSection n="5" title="Utilisation du service">
        <p>L&apos;utilisateur garantit :</p>
        <ul>
          <li>disposer des droits nécessaires sur les photographies importées ;</li>
          <li>ne pas importer de contenus illicites, diffamatoires, haineux ou portant atteinte aux droits de tiers ;</li>
          <li>utiliser Verdia uniquement dans un cadre légal.</li>
        </ul>
        <p>Il est interdit de tenter de contourner les limitations techniques ou de perturber le fonctionnement du service.</p>
      </LegalSection>

      <LegalSection n="6" title="Intelligence artificielle">
        <p>Verdia utilise notamment les modèles d&apos;intelligence artificielle de Google Gemini afin de générer les contenus demandés.</p>
        <p>Les résultats produits sont générés automatiquement et peuvent contenir des erreurs, imprécisions ou différences par rapport aux attentes.</p>
        <p>Les rendus sont fournis uniquement comme aide à la conception et à la visualisation.</p>
        <p>Ils ne constituent pas :</p>
        <ul>
          <li>un plan technique ;</li>
          <li>un plan d&apos;exécution ;</li>
          <li>un devis ;</li>
          <li>une étude de faisabilité ;</li>
          <li>une garantie de résultat.</li>
        </ul>
        <p>L&apos;utilisateur reste seul responsable des décisions prises sur la base des contenus générés.</p>
      </LegalSection>

      <LegalSection n="7" title="Propriété intellectuelle">
        <p>Verdia demeure propriétaire :</p>
        <ul>
          <li>du logiciel ;</li>
          <li>du site internet ;</li>
          <li>du logo ;</li>
          <li>de l&apos;interface ;</li>
          <li>des fonctionnalités.</li>
        </ul>
        <p>Les photographies importées restent la propriété de leurs auteurs.</p>
        <p>
          Sous réserve du respect des droits des tiers et des présentes conditions, les contenus générés peuvent
          être utilisés librement par l&apos;utilisateur dans le cadre de son activité professionnelle.
        </p>
      </LegalSection>

      <LegalSection n="8" title="Tarifs et abonnements">
        <p>Les prix sont affichés sur le site.</p>
        <p>Les abonnements sont renouvelés automatiquement jusqu&apos;à leur résiliation.</p>
        <p>L&apos;utilisateur peut mettre fin à son abonnement à tout moment depuis son espace client.</p>
        <p>La résiliation prend effet à la fin de la période déjà payée.</p>
        <p>Aucun remboursement n&apos;est effectué pour une période déjà commencée, sauf disposition légale impérative.</p>
      </LegalSection>

      <LegalSection n="9" title="Paiement">
        <p>Les paiements sont traités exclusivement par Stripe.</p>
        <p>Verdia n&apos;a jamais accès aux numéros de cartes bancaires.</p>
        <p>En cas d&apos;échec de paiement, l&apos;accès aux fonctionnalités payantes peut être suspendu.</p>
      </LegalSection>

      <LegalSection n="10" title="Disponibilité">
        <p>Verdia s&apos;efforce d&apos;assurer une disponibilité maximale.</p>
        <p>Toutefois, aucune disponibilité permanente n&apos;est garantie.</p>
        <p>Des interruptions peuvent intervenir pour :</p>
        <ul>
          <li>maintenance ;</li>
          <li>mise à jour ;</li>
          <li>incident technique ;</li>
          <li>force majeure.</li>
        </ul>
      </LegalSection>

      <LegalSection n="11" title="Limitation de responsabilité">
        <p>Dans les limites autorisées par la loi, Verdia ne pourra être tenu responsable notamment :</p>
        <ul>
          <li>des pertes d&apos;exploitation ;</li>
          <li>de la perte de clientèle ;</li>
          <li>d&apos;une mauvaise interprétation des rendus ;</li>
          <li>d&apos;une erreur de conception réalisée par l&apos;utilisateur ;</li>
          <li>de pertes indirectes ou immatérielles.</li>
        </ul>
        <p>La responsabilité maximale de Verdia est limitée au montant effectivement payé par l&apos;utilisateur au cours des douze derniers mois.</p>
      </LegalSection>

      <LegalSection n="12" title="Protection des données">
        <p>Verdia respecte le Règlement Général sur la Protection des Données (RGPD).</p>
        <p>Les données peuvent comprendre notamment :</p>
        <ul>
          <li>nom ;</li>
          <li>adresse e-mail ;</li>
          <li>informations de connexion ;</li>
          <li>photographies importées ;</li>
          <li>historique des générations ;</li>
          <li>informations relatives aux abonnements.</li>
        </ul>
        <p>Les données bancaires sont exclusivement traitées par Stripe.</p>
        <p>Pour le détail des traitements, consultez notre <Link href="/legal/privacy" className="text-sage-600 underline underline-offset-2 hover:text-sage-700">politique de confidentialité</Link>.</p>
      </LegalSection>

      <LegalSection n="13" title="Utilisation des images">
        <p>Les images envoyées par l&apos;utilisateur sont utilisées uniquement afin de produire les rendus demandés.</p>
        <p>Selon la fonctionnalité utilisée, elles peuvent être transmises de manière sécurisée à Google Gemini pour permettre la génération des contenus.</p>
        <p>Verdia ne revendique aucun droit de propriété sur les photographies importées.</p>
      </LegalSection>

      <LegalSection n="14" title="Prestataires">
        <p>Verdia utilise différents prestataires techniques, notamment :</p>
        <ul>
          <li>Google Gemini pour la génération de contenus IA ;</li>
          <li>Stripe pour les paiements ;</li>
          <li>les services d&apos;hébergement et d&apos;infrastructure nécessaires au fonctionnement de la plateforme.</li>
        </ul>
        <p>Ces prestataires traitent uniquement les données nécessaires à la fourniture du service.</p>
      </LegalSection>

      <LegalSection n="15" title="Conservation des données">
        <p>Les données sont conservées uniquement pendant la durée nécessaire :</p>
        <ul>
          <li>au fonctionnement du service ;</li>
          <li>au respect des obligations légales ;</li>
          <li>à la gestion de la relation client.</li>
        </ul>
      </LegalSection>

      <LegalSection n="16" title="Droits des utilisateurs">
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

      <LegalSection n="17" title="Cookies">
        <p>Verdia utilise des cookies afin :</p>
        <ul>
          <li>d&apos;assurer le fonctionnement du site ;</li>
          <li>de maintenir la session utilisateur ;</li>
          <li>de mesurer l&apos;audience ;</li>
          <li>d&apos;améliorer le service.</li>
        </ul>
        <p>
          Les cookies non essentiels sont soumis au consentement de l&apos;utilisateur lorsque la réglementation
          l&apos;exige. Voir notre <Link href="/legal/cookies" className="text-sage-600 underline underline-offset-2 hover:text-sage-700">politique de cookies</Link>.
        </p>
      </LegalSection>

      <LegalSection n="18" title="Sécurité">
        <p>Verdia met en œuvre des mesures techniques et organisationnelles raisonnables afin de protéger les données contre toute perte, accès non autorisé ou divulgation.</p>
        <p>Aucun système informatique ne pouvant garantir une sécurité absolue, Verdia ne peut toutefois garantir une protection totale contre tous les risques.</p>
      </LegalSection>

      <LegalSection n="19" title="Suspension ou résiliation">
        <p>Verdia peut suspendre immédiatement un compte en cas :</p>
        <ul>
          <li>d&apos;utilisation frauduleuse ;</li>
          <li>de tentative de piratage ;</li>
          <li>de non-paiement ;</li>
          <li>de violation des présentes conditions.</li>
        </ul>
      </LegalSection>

      <LegalSection n="20" title="Modification des conditions">
        <p>Les présentes conditions peuvent être modifiées à tout moment.</p>
        <p>La version publiée sur le site fait foi.</p>
      </LegalSection>

      <LegalSection n="21" title="Droit applicable">
        <p>Les présentes conditions sont régies par le droit portugais.</p>
        <p>Les parties s&apos;engagent à rechercher une solution amiable avant toute procédure judiciaire.</p>
      </LegalSection>

      <LegalSection n="22" title="Contact">
        <p>Toute question peut être adressée à <a href="mailto:verdia.rendus@gmail.com">verdia.rendus@gmail.com</a>.</p>
      </LegalSection>
    </LegalPageLayout>
  )
}
