export default function BookADemoPage() {
  return (
    <div className="pt-32 pb-20 page-container">
      <div className="max-w-3xl mx-auto text-center">
        <p className="eyebrow mb-4">Book a demo</p>
        <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-display font-bold text-offwhite mb-4">
          See CarGlow live.<br /><span className="text-gradient">30 minutes. No pressure.</span>
        </h1>
        <p className="text-offwhite/50 mb-10 max-w-xl mx-auto">We'll show you the product, answer your questions, and process a few of your own car photos live on the call.</p>

        {/* Cal.com embed placeholder */}
        <div className="card-noise rounded-3xl overflow-hidden" style={{ minHeight: 600 }}>
          <div className="flex items-center justify-center h-[600px] flex-col gap-4 text-offwhite/30">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-3xl">📅</div>
            <p className="text-sm font-medium">Cal.com embed</p>
            <p className="text-xs text-offwhite/20">Replace with: &lt;Cal namespace="demo" /&gt;</p>
            <a href="https://cal.com" target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-glow-500 text-midnight text-sm font-semibold hover:bg-glow-400 transition-all">
              Book on Cal.com →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
