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

// ── 1. Email de bienvenue ────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  const displayName = name.split(' ')[0] || name

  await sendEmail({
    to,
    subject: 'Bienvenue sur Verdia 🌿',
    text: `Bonjour ${displayName},\n\nVotre compte est créé. Visualisez votre jardin transformé en quelques secondes.\n\nCommencer → https://verdia-app.com/app\n\nL'équipe Verdia`,
    html: layout(`
      ${h1(`Bienvenue, ${displayName} 👋`)}
      ${p('Votre compte est prêt. Vous pouvez dès maintenant visualiser votre jardin transformé en quelques secondes grâce à notre IA.')}
      ${p('Importez une photo de votre jardin, choisissez un style, et recevez votre rendu.')}
      <div style="text-align:center;margin:28px 0">
        ${btn('https://verdia-app.com/app', 'Accéder à mon espace →')}
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
