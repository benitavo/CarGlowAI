import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Constructed lazily (not at module scope) so importing this route — e.g. during Next's
// build-time page-data collection — never throws just because RESEND_API_KEY isn't set
// in that environment. The key is only actually needed once a request comes in.
let resend: Resend | null = null
function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function POST(req: Request) {
  const { prenom, nom, email, sujet, message } = await req.json()

  if (!email || !message || !prenom) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
  }

  const { error } = await getResend().emails.send({
    from:    'Verdia <noreply@verdia-app.com>',
    to:      'verdia.rendus@gmail.com',
    replyTo: email,
    subject: `${prenom} ${nom} via Verdia${sujet ? ` — ${sujet}` : ''}`,
    text:    `De : ${prenom} ${nom} <${email}>\nSujet : ${sujet}\n\n${message}`,
    html:    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#0d1f11">Nouveau message via verdia.app</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:6px 0;color:#666;width:100px">De</td><td style="padding:6px 0;font-weight:600">${prenom} ${nom}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:6px 0;color:#666">Sujet</td><td style="padding:6px 0">${sujet || '—'}</td></tr>
        </table>
        <div style="background:#f5faf6;border-radius:12px;padding:16px;white-space:pre-wrap;color:#0d1f11">${message}</div>
      </div>
    `,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
