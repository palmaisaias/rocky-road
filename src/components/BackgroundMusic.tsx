import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
  src: string
  /** If true, we’ll try to auto-play at mount (browser may block). */
  autoStart?: boolean
}

/**
 * Plays looping background music. Tries to auto-play with sound; if blocked,
 * shows a tiny “Enable sound” pill the user can tap once.
 * Exposes pause/resume via returned ref (parent can control it).
 */
const BackgroundMusic = React.forwardRef<HTMLAudioElement, Props>(function BackgroundMusic(
  { src, autoStart = true }, ref
) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [blocked, setBlocked] = useState(false) // autoplay blocked by browser?
  const [enabled, setEnabled] = useState(false) // user granted play() once

  // expose the <audio> to the parent
  useEffect(() => {
    if (!ref) return
    if (typeof ref === 'function') ref(audioRef.current)
    else (ref as React.MutableRefObject<HTMLAudioElement | null>).current = audioRef.current
  }, [ref])

  // attempt autoplay with sound on mount
  useEffect(() => {
    if (!autoStart || !audioRef.current) return
    audioRef.current.loop = true
    audioRef.current.volume = 0.35
    audioRef.current.play().then(() => {
      setEnabled(true)
      setBlocked(false)
    }).catch(() => {
      setBlocked(true)
    })
  }, [autoStart])

  const handleEnable = async () => {
    if (!audioRef.current) return
    try {
      audioRef.current.loop = true
      audioRef.current.volume = 0.35
      await audioRef.current.play()
      setEnabled(true)
      setBlocked(false)
    } catch {
      setBlocked(true)
    }
  }

  return (
    <>
      <audio ref={audioRef} src={src} preload="auto" />
      {blocked && (
        <motion.button
          onClick={handleEnable}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="position-fixed bottom-0 start-50 translate-middle-x mb-3 border-0 px-3 py-2 rounded-pill"
          style={{
            background: 'rgba(16,185,129,0.2)',
            color: '#a7f3d0',
            backdropFilter: 'blur(6px)',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          Enable background music
        </motion.button>
      )}

      {enabled && !blocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="position-fixed bottom-0 end-0 m-3 px-2 py-1 small rounded"
          style={{
            background: 'rgba(16,185,129,0.15)',
            color: '#a7f3d0',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          🎵 Music playing
        </motion.div>
      )}
    </>
  )
})

export default BackgroundMusic