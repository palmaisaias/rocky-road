import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTypewriter } from '../hooks/useTypewriter'

export default function HummelMessage() {
const message = useMemo(
  () =>
    `PALMA SIBLINGS—MARINES,\n\n` +
    `Stand by for orders.\n\n` +
    `Operation: THE ROCK\n` +
    `Rendezvous: Living room, zero-hour.\n` +
    `Comms: Phones silent. Quotes permitted. Sarcasm encouraged.\n\n` +
    `Listen up. Tonight is not about comfort. It's not about "just watching a movie." This is about honor. Discipline. And the sacred duty of laughing your a** off when Sean Connery opens his mouth. The weak will wander to the kitchen mid-scene. The strong will hold the line—snacks in hand—eyes on the screen. If you feel your focus drifting, remember: Marines don’t quit halfway through the car chase.\n\n` +
    `Mission Objectives:\n` +
    `• Secure snacks.\n` +
    `• Survive the car chase.\n` +
    `• Cheer when Mason delivers, "Welcome to The Rock."\n` +
    `• Make the enemy (boredom) regret ever stepping foot in this house.\n\n` +
    `This is your mission. Fail, and you’ll be scrubbing popcorn butter out of the couch cushions until next Christmas. Now move out.`,
  []
  )

  const { text, isDone } = useTypewriter(message, 22, 800)

  return (
    <section className="mb-4">
      <div className="d-flex align-items-start gap-3">
        <div className="d-none d-sm-block mt-1 rounded-circle" style={{
          width: 12, height: 12, background: 'var(--emerald)',
          boxShadow: '0 0 12px 2px rgba(16,185,129,0.9)'
        }} />
        <div className="flex-grow-1 w-100">
          <header className="d-flex align-items-center gap-2 mb-2">
            <h1 className="h-ox fw-semibold fs-4 mb-0">SECURE TRANSMISSION - GENERAL HUMMEL</h1>
            <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>
              Status: LIVE
            </span>
          </header>

          <div className="terminal">
            <div className="mb-2 d-flex align-items-center gap-2" style={{ color: 'rgba(167,243,208,0.8)' }}>
              <span className="rounded-circle" style={{ width: 8, height: 8, background: '#34d399', boxShadow: '0 0 10px rgba(16,185,129,0.8)' }} />
              <span className="small">CHANNEL 33 • VX CONSOLE</span>
            </div>

            <motion.pre
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mb-0"
              style={{ whiteSpace: 'pre-wrap', fontSize: 20, lineHeight: 1.35 }}
            >
              {text} {!isDone && <span className="cursor" aria-hidden="true" />}
            </motion.pre>
          </div>
        </div>
      </div>
    </section>
  )
}