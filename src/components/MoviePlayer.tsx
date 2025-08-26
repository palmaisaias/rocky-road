import { useImperativeHandle, useRef, forwardRef } from 'react'

export type MoviePlayerHandle = {
  getVideo: () => HTMLVideoElement | null
}

type Props = {
  posterDataUrl?: string
}

const MoviePlayer = forwardRef<MoviePlayerHandle, Props>(function MoviePlayer(
  { posterDataUrl }, ref
) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      getVideo: () => videoRef.current
    }),
    []
  )

  return (
    <section className="card-frame">
      <header className="d-flex align-items-center justify-content-between mb-2">
        <h2 className="h-ox fw-bold fs-4 mb-0">Screening Room</h2>
        <span className="text-secondary small">MP4 or HLS supported</span>
      </header>

      <div className="position-relative overflow-hidden rounded" style={{ background: '#0b0f0e' }}>
        <video
          ref={videoRef}
          className="w-100"
          controls
          playsInline
          preload="metadata"
          poster={posterDataUrl}
        >
          <source src="/video/the-rock-trailer.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <p className="text-secondary small mt-2 mb-0">
        Tip: keep video at same origin in dev. For Vite, put files under <code>/public/video/</code>.
      </p>
    </section>
  )
})

export default MoviePlayer