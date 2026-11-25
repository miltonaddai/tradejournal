import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const faqItems = [
  {
    question: 'How does the trading journal work?',
    answer:
      'Import your trades, review each one day by day, record your observations, and group trades by strategy. Your dashboard turns that data into clear performance metrics and patterns.',
  },
  {
    question: 'Which brokers and platforms can I import from?',
    answer:
      'Any platform that exports trades as CSV. Common column names such as symbol, entry/exit time, entry/exit price, side, and PnL are detected automatically, and you can keep several accounts side by side.',
  },
  {
    question: 'Can I create and compare trading strategies?',
    answer:
      'Yes. Build custom strategies, define their entry, exit, and risk rules, and give each one a marker so it is easy to spot across your journal.',
  },
  {
    question: 'Where is my trading data stored?',
    answer:
      'Everything is stored by the server you run—by default a local JSON file next to the backend. Nothing is sent to third-party services, so the app works fully offline.',
  },
  {
    question: 'Is it free?',
    answer:
      'Yes. The project is open source under the MIT license. Run it locally, self-host it, or fork it and make it your own.',
  },
]

const steps = [
  { step: '1', label: 'Review', position: 'step-card-pos-1' },
  { step: '2', label: 'Journal', position: 'step-card-pos-2' },
  { step: '3', label: 'Strategize', position: 'step-card-pos-3' },
]

const heroTitle = "World's Best Journaling Software"
const heroTaglines = ['Know Your Trades', 'Build Your Strategies']

const heroEase = [0.22, 1, 0.36, 1] as const

function SectionDivider() {
  return (
    <div className="flex w-full items-center justify-center px-6 py-8">
      <div className="section-divider" />
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-12 text-center font-body text-4xl md:mb-16 md:text-5xl lg:text-6xl">
      {children}
    </h2>
  )
}

export function LandingPage() {
  return (
    <div className="bg-mesh">
      <Navbar />

      {/* Hero — full viewport */}
      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-sketch text-5xl leading-tight md:text-7xl">
          {heroTitle.split(' ').map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              initial={{ opacity: 0, y: 48, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.75,
                delay: 0.12 + index * 0.09,
                ease: heroEase,
              }}
              className="mr-[0.28em] inline-block last:mr-0"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:mt-10">
          {heroTaglines.map((tagline, index) => (
            <motion.div
              key={tagline}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.85 + index * 0.18,
                ease: heroEase,
              }}
              className="flex items-center gap-3"
            >
              <motion.span
                initial={{ scale: 0, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 16,
                  delay: 1 + index * 0.18,
                }}
                className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-xl md:h-10 md:w-10"
                aria-hidden
              >
                <span className="font-sketch text-2xl leading-none text-white/80 md:text-3xl">
                  ✓
                </span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 1.05 + index * 0.18,
                  ease: heroEase,
                }}
                className="font-sketch text-2xl text-white/85 md:text-3xl"
              >
                {tagline}
              </motion.span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 1.45, ease: heroEase }}
          className="mt-16 md:mt-20"
        >
          <Link to="/app/dashboard">
            <Button
              size="lg"
              className="h-14 min-w-[17rem] gap-3 px-12 text-lg md:h-16 md:min-w-[19rem] md:px-14 md:text-xl"
            >
              Start Journaling
              <Pencil className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <SectionDivider />

      {/* How it Works */}
      <section id="how-it-works" className="flex min-h-screen flex-col px-6 pb-20 pt-28 md:pt-32">
        <SectionHeading>How it Works</SectionHeading>

        <div className="flex flex-1 items-center justify-center overflow-hidden">
          <div className="how-it-works-cards relative mx-auto">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`absolute ${item.position}`}
              >
                <div className="glass-step-card step-card relative">
                  <span className="step-card-number absolute font-sketch leading-none text-white/90">
                    {item.step}
                  </span>
                  <div className="flex h-full items-center justify-center">
                    <span className="step-card-label font-sketch text-center leading-none">
                      {item.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* FAQ */}
      <section id="faq" className="flex min-h-screen flex-col px-6 pb-20 pt-28 md:pt-32">
        <div className="mx-auto w-full max-w-5xl">
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          <p className="-mt-8 mb-12 text-center text-base leading-relaxed text-white/50 md:-mt-10 md:mb-14 md:text-lg">
            Everything you need to know about importing, reviewing, and learning from your trades.
          </p>

          <Accordion type="single" collapsible className="flex flex-col gap-4 md:gap-5">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="mb-0">
                  <AccordionTrigger className="rounded-2xl border-white/10 bg-white/[0.045] px-5 py-5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/20 hover:bg-white/[0.075] md:px-7 md:py-6 md:text-lg">
                    <span className="flex items-center gap-4 pr-4 md:gap-6">
                      <span className="font-sketch text-xl text-white/35 md:text-2xl">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{item.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="mx-3 rounded-b-2xl border-x border-b border-white/10 bg-black/20 px-6 pb-6 pt-5 text-sm leading-7 text-white/65 md:mx-5 md:px-8 md:text-base">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      </section>

      <SectionDivider />

      <Footer />
    </div>
  )
}
