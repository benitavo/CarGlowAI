import { Resend } from 'resend'

const FROM    = 'Verdia <noreply@verdia-app.com>'
const REPLY_TO = 'verdia.rendus@gmail.com'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

// ── Generic send ─────────────────────────────────────────────────────────────

async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  text: string
}) {
  try {
    const { error } = await getResend().emails.send({
      from:    FROM,
      replyTo: REPLY_TO,
      to:      opts.to,
      subject: opts.subject,
      html:    opts.html,
      text:    opts.text,
    })
    if (error) console.error('[email] send error:', error)
  } catch (err) {
    console.error('[email] unexpected error:', err)
  }
}

// ── Shared layout ─────────────────────────────────────────────────────────────

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3faf0;font-family:system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3faf0;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center">
          <span style="font-size:22px;font-weight:700;color:#1e7035;letter-spacing:-0.5px">Verdia</span>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;padding:40px 36px;border:1px solid rgba(13,31,17,0.07)">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#888">
          Verdia · <a href="https://verdia-app.com" style="color:#35a070;text-decoration:none">verdia-app.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

const btn = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block;margin-top:8px;padding:14px 28px;background:#35a070;color:#ffffff;font-size:15px;font-weight:600;border-radius:10px;text-decoration:none">${label}</a>
`

const h1 = (text: string) =>
  `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0d1f11;letter-spacing:-0.3px">${text}</h1>`

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(13,31,17,0.72)">${text}</p>`

// ── 1. Email du "moment magique" ──────────────────────────────────────────────
// Déclenché par le tout premier rendu réussi (voir /api/generate), pas par
// l'inscription ou la vérification d'e-mail — on réagit à l'action, pas au compte.
// Capitalise sur l'émotion pendant qu'elle est là plutôt que d'attendre un batch.

export async function sendWelcomeEmail(to: string, name: string, imageUrl?: string) {
  const displayName = name.split(' ')[0] || name

  await sendEmail({
    to,
    subject: 'Votre premier rendu est prêt 🌿',
    text: `Bonjour ${displayName},\n\nVoici votre tout premier rendu Verdia — la transformation de votre jardin en quelques secondes.\n\nVoir mon espace → https://verdia-app.com/app\n\nL'équipe Verdia`,
    html: layout(`
      ${h1(`Bravo, ${displayName} — voici votre premier rendu 👋`)}
      ${imageUrl ? `<div style="text-align:center;margin:0 0 20px"><img src="${imageUrl}" alt="Votre rendu" style="max-width:100%;border-radius:12px;border:1px solid rgba(13,31,17,0.08)"></div>` : ''}
      ${p('Votre jardin transformé, généré en quelques secondes. Essayez un autre style, ou passez à la vidéo pour un rendu encore plus convaincant auprès de vos clients.')}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/app/editor', 'Créer un nouveau rendu →')}
      </div>
      ${p('Si vous avez des questions, répondez simplement à cet email.')}
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}

// ── 2. Email de facture ───────────────────────────────────────────────────────

export interface InvoiceData {
  invoiceNumber: string   // ex: "INV-2024-001"
  date: string            // ex: "17 juillet 2026"
  description: string     // ex: "Plan Starter — 500 crédits"
  amountEur: string       // ex: "49,00 €"
  receiptUrl?: string     // lien Stripe vers la facture PDF
}

export async function sendInvoiceEmail(to: string, invoice: InvoiceData) {
  const { invoiceNumber, date, description, amountEur, receiptUrl } = invoice

  await sendEmail({
    to,
    subject: `Votre reçu Verdia — ${invoiceNumber}`,
    text: `Bonjour,\n\nVoici votre reçu pour votre achat du ${date}.\n\nDescription : ${description}\nMontant : ${amountEur}\nNuméro : ${invoiceNumber}\n\n${receiptUrl ? `Télécharger la facture : ${receiptUrl}\n\n` : ''}Merci de votre confiance.\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('Votre reçu de paiement')}
      ${p(`Merci pour votre achat du <strong>${date}</strong>. Voici le récapitulatif :`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse">
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:10px 0;font-size:14px;color:#888">Numéro</td>
          <td style="padding:10px 0;font-size:14px;color:#0d1f11;text-align:right">${invoiceNumber}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:10px 0;font-size:14px;color:#888">Description</td>
          <td style="padding:10px 0;font-size:14px;color:#0d1f11;text-align:right">${description}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:16px;font-weight:700;color:#0d1f11">Total</td>
          <td style="padding:10px 0;font-size:16px;font-weight:700;color:#1e7035;text-align:right">${amountEur}</td>
        </tr>
      </table>
      ${receiptUrl ? `<div style="text-align:center;margin:24px 0">${btn(receiptUrl, 'Télécharger la facture →')}</div>` : ''}
      ${p('Pour toute question sur votre facture, répondez à cet email.')}
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}

// ── 3. Email de vérification d'adresse ──────────────────────────────────────

export async function sendVerificationEmail(to: string, verifyLink: string) {
  await sendEmail({
    to,
    subject: 'Vérifiez votre adresse email — Verdia',
    text: `Bonjour,\n\nCliquez sur ce lien pour confirmer votre adresse email (valable 24h) :\n${verifyLink}\n\nSi vous n'avez pas créé de compte Verdia, ignorez cet email.\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('Confirmez votre adresse email')}
      ${p('Merci de vous être inscrit sur Verdia ! Cliquez sur le bouton ci-dessous pour activer votre compte.')}
      ${p('Ce lien est valable <strong>24 heures</strong>.')}
      <div style="text-align:center;margin:28px 0">
        ${btn(verifyLink, 'Confirmer mon adresse email →')}
      </div>
      ${p('Si vous n\'avez pas créé de compte Verdia, ignorez simplement cet email.')}
      <p style="margin:24px 0 0;font-size:13px;color:#aaa">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${verifyLink}</p>
    `),
  })
}

// ── 4. Email de réinitialisation de mot de passe ─────────────────────────────

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  await sendEmail({
    to,
    subject: 'Réinitialiser votre mot de passe Verdia',
    text: `Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe.\n\nCliquez sur ce lien (valable 1 heure) :\n${resetLink}\n\nSi vous n'avez pas fait cette demande, ignorez cet email.\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('Réinitialisation du mot de passe')}
      ${p('Vous avez demandé à réinitialiser le mot de passe de votre compte Verdia.')}
      ${p('Cliquez sur le bouton ci-dessous. Ce lien est valable <strong>1 heure</strong>.')}
      <div style="text-align:center;margin:28px 0">
        ${btn(resetLink, 'Réinitialiser mon mot de passe →')}
      </div>
      ${p('Si vous n\'avez pas fait cette demande, ignorez simplement cet email — votre mot de passe ne changera pas.')}
      <p style="margin:24px 0 0;font-size:13px;color:#aaa">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${resetLink}</p>
    `),
  })
}

// ── 5. Email de renouvellement des crédits gratuits ──────────────────────────
// Plan FREE uniquement : les renouvellements payants ont déjà leur propre e-mail
// de facture (sendInvoiceEmail), qui mentionne déjà le renouvellement — en envoyer
// un second ici pour les abonnés payants ferait doublon.

export async function sendCreditsResetEmail(to: string, opts: { credits: number; name?: string }) {
  const { credits, name } = opts
  const displayName = name?.split(' ')[0] || null

  await sendEmail({
    to,
    subject: `Vos ${credits} crédits du mois sont disponibles`,
    text: `Bonjour${displayName ? ` ${displayName}` : ''},\n\nVos ${credits} crédits gratuits du mois viennent d'être renouvelés.\n\nGénérer un rendu → https://verdia-app.com/app/editor\n\nL'équipe Verdia`,
    html: layout(`
      ${h1(`${credits} crédits vous attendent`)}
      ${p(`Bonjour${displayName ? ` ${displayName}` : ''}, vos crédits gratuits du mois viennent d'être renouvelés.`)}
      ${p('Profitez-en pour générer un nouveau rendu ou essayer un style que vous n\'avez pas encore testé.')}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/app/editor', 'Générer un rendu →')}
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}

// ── 6. Email de réactivation ─────────────────────────────────────────────────
// Envoyé une fois qu'un espace de travail n'a produit aucun rendu depuis 14 jours,
// pour rappeler que des crédits gratuits sont peut-être encore disponibles.

export async function sendReactivationEmail(to: string, opts: { name?: string }) {
  const displayName = opts.name?.split(' ')[0] || null

  await sendEmail({
    to,
    subject: 'Votre jardin de rêve vous attend toujours',
    text: `Bonjour${displayName ? ` ${displayName}` : ''},\n\nÇa fait un moment que vous n'avez pas généré de rendu sur Verdia. Vos crédits du mois sont peut-être encore disponibles.\n\nGénérer un rendu → https://verdia-app.com/app/editor\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('On ne vous a pas revu récemment')}
      ${p(`Bonjour${displayName ? ` ${displayName}` : ''}, ça fait un moment que vous n'avez pas généré de rendu sur Verdia.`)}
      ${p('Si vous avez un nouveau chantier ou un client à convaincre, vos crédits du mois sont peut-être encore disponibles.')}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/app/editor', 'Générer un rendu →')}
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}

// ── 7. Email de demande d'avis ────────────────────────────────────────────────
// Envoyé une fois (voir Workspace.reviewRequestedAt) qu'un espace de travail a
// produit 3 rendus — assez d'usage réel pour avoir un avis à donner.

export async function sendReviewRequestEmail(to: string, opts: { name?: string }) {
  const displayName = opts.name?.split(' ')[0] || null

  await sendEmail({
    to,
    subject: 'Un avis sur Verdia ?',
    text: `Bonjour${displayName ? ` ${displayName}` : ''},\n\nVous utilisez Verdia depuis quelques rendus déjà — votre avis nous aiderait à faire découvrir l'outil à d'autres paysagistes.\n\nDonner mon avis (2 minutes) → https://verdia-app.com/app/review\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('Votre avis compte')}
      ${p(`Bonjour${displayName ? ` ${displayName}` : ''}, vous utilisez Verdia depuis quelques rendus déjà.`)}
      ${p('Un avis de votre part — deux minutes, avec possibilité d\'affichage public — aiderait d\'autres paysagistes à découvrir l\'outil.')}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/app/review', 'Donner mon avis →')}
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}

// ── 8. Email de découverte (2ᵉ rendu) ─────────────────────────────────────────
// Déclenché par le 2ᵉ rendu réussi — construire l'habitude avant d'atteindre le
// plafond de crédits, en pointant vers une fonctionnalité pas encore essayée.

export async function sendFeatureDiscoveryEmail(to: string, opts: { name?: string }) {
  const displayName = opts.name?.split(' ')[0] || null

  await sendEmail({
    to,
    subject: 'Et si vous transformiez ce rendu en vidéo ?',
    text: `Bonjour${displayName ? ` ${displayName}` : ''},\n\nVous avez déjà généré 2 rendus — essayez maintenant la vidéo avant/après ou le kit marketing pour publier directement sur vos réseaux.\n\nDécouvrir → https://verdia-app.com/app/editor\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('Deux rendus déjà — allons plus loin')}
      ${p(`Bonjour${displayName ? ` ${displayName}` : ''}, vous commencez à prendre en main Verdia.`)}
      ${p('Saviez-vous que vous pouvez aussi générer une vidéo avant/après, ou transformer un rendu en contenu prêt à publier sur Instagram et Facebook ?')}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/app/editor', 'Essayer maintenant →')}
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}

// ── 9. Email crédits épuisés ───────────────────────────────────────────────────
// Déclenché quand une déduction échoue faute de crédits, pour un espace de travail
// qui a déjà un vrai usage derrière lui — le signal d'intention le plus fort du
// cycle. Envoyé le jour même (voir deductCredits dans src/lib/credits.ts).

export async function sendCreditsExhaustedEmail(to: string, opts: { name?: string }) {
  const displayName = opts.name?.split(' ')[0] || null

  await sendEmail({
    to,
    subject: 'Vous avez utilisé tous vos crédits',
    text: `Bonjour${displayName ? ` ${displayName}` : ''},\n\nVous avez utilisé tous vos crédits gratuits ce mois-ci — signe que Verdia vous est utile. Un rendu coûte environ 1,50€ avec un abonnement, contre 500 à 2000€ pour une maquette 3D classique.\n\nDébloquer plus de crédits → https://verdia-app.com/app/billing?topup=1\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('Vous avez utilisé tous vos crédits')}
      ${p(`Bonjour${displayName ? ` ${displayName}` : ''}, vous avez épuisé vos crédits gratuits de ce mois — c'est plutôt bon signe, ça veut dire que Verdia vous sert vraiment.`)}
      ${p('Avec un abonnement, chaque rendu revient à environ 1,50€ — contre 500 à 2 000€ pour une maquette 3D classique.')}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/app/billing?topup=1', 'Débloquer plus de crédits →')}
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}

// ── 10. Email de relance crédits épuisés (J+2) ────────────────────────────────

export async function sendCreditsExhaustedFollowupEmail(to: string, opts: { name?: string }) {
  const displayName = opts.name?.split(' ')[0] || null

  await sendEmail({
    to,
    subject: 'Votre travail est toujours là',
    text: `Bonjour${displayName ? ` ${displayName}` : ''},\n\nVos rendus précédents sont toujours dans votre espace Verdia. Dès que vous êtes prêt, un abonnement débloque de nouveaux crédits immédiatement.\n\nVoir les plans → https://verdia-app.com/app/billing\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('Votre travail est toujours là')}
      ${p(`Bonjour${displayName ? ` ${displayName}` : ''}, vos rendus précédents sont toujours disponibles dans votre espace.`)}
      ${p('Dès que vous êtes prêt à continuer, un abonnement débloque de nouveaux crédits immédiatement.')}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/app/billing', 'Voir les plans →')}
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}

// ── 11. Email de relance précoce (jamais activé, J+1) ─────────────────────────
// Pour les comptes créés depuis ~1 jour sans aucun rendu — réduire la friction,
// pas relancer un usage qui n'a jamais eu lieu.

export async function sendActivationNudgeEmail(to: string, opts: { name?: string }) {
  const displayName = opts.name?.split(' ')[0] || null

  await sendEmail({
    to,
    subject: 'Une photo suffit pour commencer',
    text: `Bonjour${displayName ? ` ${displayName}` : ''},\n\nVous vous êtes inscrit sur Verdia mais n'avez pas encore essayé — une seule photo de jardin suffit pour voir le résultat en 60 secondes.\n\nEssayer maintenant → https://verdia-app.com/app/editor\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('Une photo suffit pour commencer')}
      ${p(`Bonjour${displayName ? ` ${displayName}` : ''}, vous vous êtes inscrit sur Verdia mais n'avez pas encore essayé.`)}
      ${p('Une seule photo de jardin suffit pour voir un rendu transformé en 60 secondes — sans engagement, gratuitement.')}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/app/editor', 'Essayer maintenant →')}
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}

// ── 12. Email de relance finale (jamais activé, J+3-4) ────────────────────────
// Dernière tentative, geste le plus réduit possible : voir un exemple plutôt que
// d'importer sa propre photo. Aucune autre relance après celle-ci.

export async function sendFinalActivationNudgeEmail(to: string, opts: { name?: string }) {
  const displayName = opts.name?.split(' ')[0] || null

  await sendEmail({
    to,
    subject: 'Un exemple en 10 secondes, sans importer de photo',
    text: `Bonjour${displayName ? ` ${displayName}` : ''},\n\nPas encore essayé Verdia ? Voyez un exemple de transformation sans même importer de photo.\n\nVoir un exemple → https://verdia-app.com/#galerie\n\nL'équipe Verdia`,
    html: layout(`
      ${h1('Voyez un exemple, sans rien importer')}
      ${p(`Bonjour${displayName ? ` ${displayName}` : ''}, si le temps vous a manqué jusqu'ici, voici un raccourci : quelques exemples de transformations réelles, sans avoir besoin d'importer votre propre photo.`)}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/#galerie', 'Voir des exemples →')}
      </div>
      ${p('Et si vous préférez essayer directement avec votre propre jardin, ça reste à un clic.')}
      <p style="margin:24px 0 0;font-size:14px;color:#888">L'équipe Verdia</p>
    `),
  })
}
