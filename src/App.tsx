import { useEffect, useRef, useState } from 'react'
import PageShell from './components/PageShell'
import HummelMessage from './components/HummelMessage'
import SnackSuggestions from './components/SnackSuggestions'
import MoviePlayer from './components/MoviePlayer'
import type { MoviePlayerHandle } from './components/MoviePlayer'
import BackgroundMusic from './components/BackgroundMusic'
import TunnelsGame from './components/TunnelsGame'

const poster = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'>
  <defs>
    <linearGradient id='g' x1='0' x2='1'>
      <stop offset='0%' stop-color='%2310b981' stop-opacity='0.25'/>
      <stop offset='100%' stop-color='%23000000' stop-opacity='0.6'/>
    </linearGradient>
  </defs>
  <rect width='1200' height='675' fill='%230b0f0e'/>
  <rect width='1200' height='675' fill='url(%23g)'/>
  <g fill='%23cbd5e1' font-family='monospace'>
    <text x='60' y='120' font-size='42'>SCREENING ROOM - THE ROCK</text>
    <text x='60' y='180' font-size='22' fill='%23a7f3d0'>Palma Siblings Ops</text>
    <text x='60' y='260' font-size='18'>Winners go home and fuck the prom queen...</text>
  </g>
</svg>`

export default function App() {
  const [showPlayer, setShowPlayer] = useState(false)
  const bgRef = useRef<HTMLAudioElement | null>(null)
  const playerRef = useRef<MoviePlayerHandle>(null)

  useEffect(() => {
    const video = playerRef.current?.getVideo()
    if (!video) return

    const pauseBg = () => bgRef.current?.pause()
    const resumeBg = () => {
      if (bgRef.current && bgRef.current.currentTime > 0) {
        bgRef.current.play().catch(() => void 0)
      }
    }

    video.addEventListener('play', pauseBg)
    video.addEventListener('ended', resumeBg)
    return () => {
      video.removeEventListener('play', pauseBg)
      video.removeEventListener('ended', resumeBg)
    }
  }, [showPlayer]) // rebind when player mounts

  return (
    <PageShell>
      {/* Background music tries to autoplay, shows a small banner if blocked. */}
      <BackgroundMusic ref={bgRef} src="/audio/briefing.mp3" autoStart />

      {!showPlayer ? (
        <>
          <HummelMessage />
          <SnackSuggestions />
          <TunnelsGame />
          <div className="text-center my-5">
            <button className="btn btn-success btn-lg" onClick={() => setShowPlayer(true)}>
              Enter the Island
            </button>
          </div>
        </>
      ) : (
        <div className="container py-4">
          <MoviePlayer ref={playerRef} posterDataUrl={poster} />
        </div>
      )}

      <footer className="text-center text-secondary small pt-3">
        Palma Siblings · Movie Night Ops · “Welcome to The Rock.”
      </footer>
    </PageShell>
  )
}