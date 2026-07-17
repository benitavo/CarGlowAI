import { Link } from '@/i18n/routing'

export function LegalPageLayout({
  eyebrow, title, updated, children,
}: { eyebrow: string; title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="pt-32 pb-20 bg-cream-50">
      <div className="page-container max-w-3xl">
        <nav className="flex items-center gap-1.5 text-xs text-midnight/40 mb-6">
          <Link href="/" className="hover:text-midnight/70">Accueil</Link>
          <span>/</span>
          <span className="text-midnight/60">{title}</span>
        </nav>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="font-display font-bold text-midnight mb-2" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)' }}>
          {title}
        </h1>
        <p className="text-sm text-midnight/40 mb-10">Dernière mise à jour : {updated}</p>
        <div className="flex flex-col gap-9">
          {children}
        </div>
      </div>
    </div>
  )
}

export function LegalSection({
  n, title, children,
}: { n?: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-semibold text-midnight text-lg mb-3">
        {n ? `${n}. ` : ''}{title}
      </h2>
      <div className="text-[15px] text-midnight/60 leading-relaxed flex flex-col gap-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_a]:text-sage-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-sage-700">
        {children}
      </div>
    </section>
  )
}
