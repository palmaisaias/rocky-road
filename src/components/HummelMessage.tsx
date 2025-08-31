import { useMemo, useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTypewriter } from '../hooks/useTypewriter'

export default function HummelMessage() {
  // Password state
  const [password, setPassword] = useState('')
  const [variant, setVariant] = useState<'marines' | 'seals' | null>(null)
  const [denied, setDenied] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Focus input when locked
  useEffect(() => {
    if (!variant && inputRef.current) inputRef.current.focus()
  }, [variant])

  // HARD BLOCK: stop global key handlers (games, hotkeys) from eating keystrokes
  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    const stop = (e: Event) => {
      // prevent BOTH capture/bubble listeners up the tree
      e.stopPropagation()
      // @ts-ignore - native event has this
      if (typeof (e as any).stopImmediatePropagation === 'function') {
        ;(e as any).stopImmediatePropagation()
      }
    }

    const opts = { capture: true } as AddEventListenerOptions

    // Capture phase so we intercept before window listeners
    el.addEventListener('keydown', stop, opts)
    el.addEventListener('keypress', stop, opts)
    el.addEventListener('keyup', stop, opts)

    return () => {
      el.removeEventListener('keydown', stop, opts)
      el.removeEventListener('keypress', stop, opts)
      el.removeEventListener('keyup', stop, opts)
    }
  }, [variant])

  // Messages
  const marinesMessage = useMemo(
  () =>
    `MARINES,\n\n` +
    `All callsigns—report in.\n\n` +
    `Operation: THE ROCK\n` +
    `Rendezvous: Living room. Zero-hour. Bring snacks and secrets.\n` +
    `Comms: Phones dark. Eye contact strong. Shade permitted.\n\n` +
    `This isn’t movie night. This is ritual. Diana’s making lavender tea, Mary’s sketching Connery mid-line, and Rebecca is already complaining about how Edgar didn't email the link (because typing 6 characters is too much). Raquel’s late, finance brain calculating popcorn ROI. Gammy’s not here—don’t ask. Mia’s feeding the tortoise -- wait, the tortoise is gone. Fuck them kids. Xochitl brewed coffee so strong it might qualify as a controlled substance. Ely’s praying we pick a Catholic film—he’ll survive.\n\n` +
    `Listen close. When Connery opens his mouth, you hold formation. No bathroom breaks. No TikTok. Marines endure. Marines snack with discipline. Marines quote better.\n\n` +
    `Mission Objectives:\n` +
    `• Snacks secured—Greg’s tacos are not reinforcements, they’re primary.\n` +
    `• Cheer when Mason says “Welcome to The Rock” like it's scripture.\n` +
    `• Keep eyes on the screen. Not your nails, not your DMs.\n` +
    `• Make boredom wish it never showed up in this bloodline.\n\n` +
    `Break focus and you’re on butter-cleanup. Misquote a line and Raquel’s handling your sentencing. Fail the mission and Xochitl’s cutting your coffee supply. Permanently.\n\n` +
    `You’re the line. You’re the moment. Move out.`,
  []
)



  const sealsMessage = useMemo(
  () =>
    `SEALS,\n\n` +
    `Eyes up, dumb fucks. This isn’t girls' night.\n\n` +
    `Operation: GREEN SMOKE\n` +
    `Rendezvous: Couch perimeter, zero-hour. Beer cold, socks off.\n` +
    `Comms: One-liners only. No monologues. Quotes locked, sarcasm loaded.\n\n` +
    `This is elite viewing. No giggles, no TikToks, no "wait, what just happened?" You are not Raquel. You are not here for vibes. You're here for Connery.\n\n` +
    `Greg, don’t touch the remote. Ely, save the Latin unless it’s carved on a bullet. Gammy, if you bring carnitas, you're promoted. If not, shut up and hold formation.\n\n` +
    `Mission Objectives:\n` +
    `• Ration runs must be stealth ops—no kitchen clanging like Diana’s cooking show.\n` +
    `• Maintain visual on the car chase—no glancing at Rebecca’s 42nd “new” car parked outside.\n` +
    `• Confirm line: "Welcome to The Rock." React with unhinged masculine joy.\n` +
    `• Annihilate boredom. If you see a cushion with glitter on it, torch it.\n\n` +
    `Failure means you clean butter off the couch...which was porbably smothered on there by JD Vance. Out.`,
  []
)


  const selectedMessage = useMemo(() => {
    if (variant === 'marines') return marinesMessage
    if (variant === 'seals') return sealsMessage
    return ''
  }, [variant, marinesMessage, sealsMessage])

  const { text, isDone } = useTypewriter(selectedMessage, 22, 800)

  // normalize input so things like "navy-seals", "Navy  Seals", "navyseals" all map consistently
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // remove punctuation
      .replace(/\s+/g, ' ') // collapse multiple spaces to one

  // canonical map: map various user inputs to the two canonical variants
  const canonicalMap: Record<string, 'marines' | 'seals'> = {
    // marines variants
    marines: 'marines',
    marine: 'marines',
    'u.s. marines': 'marines',
    usmarines: 'marines',
    // seals variants
    seals: 'seals',
    'navy seals': 'seals',
    navyseals: 'seals',
    'navy seal': 'seals',
    navyseal: 'seals'
  }

  const submitPassword = () => {
    const key = normalize(password)
    const matched = canonicalMap[key]
    if (matched) {
      setVariant(matched)
      setDenied(false)
    } else {
      setDenied(true)
    }
  }

  const statusStyles =
    variant === null
      ? { bg: 'rgba(239,68,68,0.15)', fg: '#fca5a5', dot: '#ef4444', glow: 'rgba(239,68,68,0.9)' } // LOCKED
      : { bg: 'rgba(16,185,129,0.15)', fg: '#6ee7b7', dot: '#34d399', glow: 'rgba(16,185,129,0.9)' } // LIVE

  return (
    <section className="mb-4">
      <div className="d-flex align-items-start gap-3">
        {/* Status dot */}
        <div
          className="d-none d-sm-block mt-1 rounded-circle"
          style={{
            width: 12,
            height: 12,
            background: statusStyles.dot,
            boxShadow: `0 0 12px 2px ${statusStyles.glow}`
          }}
        />

        <div className="flex-grow-1 w-100">
          {/* Header */}
          <header className="d-flex align-items-center gap-2 mb-2">
            <h1 className="h-ox fw-semibold fs-4 mb-0">SECURE TRANSMISSION - CLASSIFIED: OPERATION AUTHORIZED</h1>
            <span className="badge" style={{ background: statusStyles.bg, color: statusStyles.fg }}>
              Status: {variant ? 'LIVE' : 'LOCKED'}
            </span>
            {variant && (
              <span
                className="badge"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd' }}
                title="Active profile"
              >
                Profile: {variant.toUpperCase()}
              </span>
            )}
          </header>

          {/* Body */}
          {!variant ? (
            <div className="terminal">
              <div className="mb-2 d-flex align-items-center gap-2" style={{ color: 'rgba(239,68,68,0.85)' }}>
                <span
                  className="rounded-circle"
                  style={{
                    width: 8,
                    height: 8,
                    background: statusStyles.dot,
                    boxShadow: `0 0 10px ${statusStyles.glow}`
                  }}
                />
                <span className="small">CHANNEL 33 • ACCESS GATE</span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-3"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                <div className="mb-2" style={{ opacity: 0.85 }}>
                  Enter password to proceed.
                </div>

                <motion.form
                  onSubmit={(e) => {
                    e.preventDefault()
                    submitPassword()
                  }}
                  animate={denied ? { x: [-10, 10, -8, 6, -4, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  className="d-flex align-items-stretch gap-2"
                >
                  <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (denied) setDenied(false)
                    }}
                    onKeyDownCapture={(e) => {
                      // React capture-phase stop
                      e.stopPropagation()
                      // @ts-ignore
                      if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                        // Ensure no other listeners fire
                        e.nativeEvent.stopImmediatePropagation()
                      }
                    }}
                    placeholder="PASSWORD"
                    className="form-control"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputMode="text"
                    enterKeyHint="go"
                    style={{
                      background: 'rgba(17,24,39,0.55)',
                      color: '#e5e7eb',
                      border: denied ? '1px solid rgba(239,68,68,0.65)' : '1px solid rgba(148,163,184,0.25)',
                      outline: 'none',
                      boxShadow: denied ? '0 0 0 3px rgba(239,68,68,0.15)' : 'none',
                      letterSpacing: 2
                    }}
                    aria-label="Password"
                  />
                  <button
                    type="submit"
                    className="btn"
                    style={{
                      background: 'var(--emerald)',
                      color: '#062e24',
                      fontWeight: 600,
                      letterSpacing: 1
                    }}
                    disabled={!password.trim()}
                  >
                    Authorize
                  </button>
                </motion.form>

                {denied && (
                  <div className="mt-2 small" style={{ color: '#fca5a5' }}>
                    Access denied.
                  </div>
                )}

                <div className="mt-3 small" style={{ color: 'rgba(148,163,184,0.8)' }}>
                  Hint: multiple units recognized.
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="terminal">
              <div className="mb-2 d-flex align-items-center gap-2" style={{ color: 'rgba(167,243,208,0.8)' }}>
                <span
                  className="rounded-circle"
                  style={{
                    width: 8,
                    height: 8,
                    background: '#34d399',
                    boxShadow: '0 0 10px rgba(16,185,129,0.8)'
                  }}
                />
                <span className="small">CHANNEL 33 • VX CONSOLE</span>
              </div>

              <motion.pre
                key={variant} // reset animation when switching profiles
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="mb-0"
                style={{ whiteSpace: 'pre-wrap', fontSize: 20, lineHeight: 1.35 }}
              >
                {text} {!isDone && <span className="cursor" aria-hidden="true" />}
              </motion.pre>

              <div className="mt-3 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setVariant(null)
                    setPassword('')
                    setDenied(false)
                    setTimeout(() => inputRef.current?.focus(), 0)
                  }}
                  style={{
                    background: 'rgba(148,163,184,0.15)',
                    color: '#e5e7eb',
                    border: '1px solid rgba(148,163,184,0.25)'
                  }}
                >
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
