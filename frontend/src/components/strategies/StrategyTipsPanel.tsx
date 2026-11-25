const tips: { title: string; body: string }[] = [
  {
    title: 'Name it clearly',
    body: 'Use a short, specific name you can spot instantly in your journal.',
  },
  {
    title: 'Make entries objective',
    body: 'Write criteria you can verify on a chart — levels, volume, time, or signals.',
  },
  {
    title: 'Define your exits',
    body: 'Set targets, stops, and time-based exits before you enter.',
  },
  {
    title: 'Add risk rules',
    body: 'Include position size, daily loss limits, and max trades per session.',
  },
  {
    title: 'Journal in notes',
    body: 'Record what worked, what didn\'t, and when you broke the rules.',
  },
]

export function StrategyTipsPanel() {
  return (
    <aside className="mx-auto max-w-xs px-6 text-center lg:px-0">
      <p className="mb-2 text-[11px] tracking-[0.2em] text-white/30 uppercase">Guide</p>
      <h2 className="mb-10 text-sm text-white/55">Writing great strategies</h2>

      <div className="space-y-8">
        {tips.map((tip) => (
          <div key={tip.title}>
            <h3 className="mb-1.5 text-sm text-white/50">{tip.title}</h3>
            <p className="text-sm leading-relaxed text-white/30">{tip.body}</p>
          </div>
        ))}
      </div>
    </aside>
  )
}
