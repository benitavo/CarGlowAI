export default function LegalPage() {
  const titles: Record<string,string> = { terms:'Terms of Service', privacy:'Privacy Policy', cookies:'Cookie Policy', dpa:'Data Processing Agreement', sla:'Service Level Agreement' }
  return (
    <div className="pt-32 pb-20 page-container max-w-2xl">
      <div className="mb-12">
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="text-3xl font-display font-bold text-offwhite mb-3">Legal Document</h1>
        <p className="text-sm text-offwhite/30">Last updated: 1 January 2025</p>
      </div>
      <div className="flex flex-col gap-8 text-offwhite/60 leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-display font-semibold text-offwhite mb-3">1. Introduction</h2>
          <p>These terms govern your use of CarGlow AI products and services. By using CarGlow, you agree to these terms.</p>
        </section>
        <section>
          <h2 className="text-lg font-display font-semibold text-offwhite mb-3">2. Service description</h2>
          <p>CarGlow AI provides AI-powered vehicle photo enhancement services for automotive dealerships, marketplaces, and related businesses.</p>
        </section>
        <section>
          <h2 className="text-lg font-display font-semibold text-offwhite mb-3">3. Contact</h2>
          <p>Questions? Email us at legal@carglowai.com</p>
        </section>
      </div>
    </div>
  )
}
