import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Vec = { x: number; y: number }
type Tile = '#' | '.' | 'E' // wall, floor, exit
type MapGrid = Tile[][]

const TILE = 24             // pixels per cell before scaling
const VIEW_SCALE = 1.5      // canvas CSS upscale factor
const FOG_RADIUS = 4        // Manhattan radius of visibility
const SUPPLY_COUNT = 6
const GUARD_COUNT = 2
const STEP_LIMIT = 400      // soft timer; run out and guards speed up


// Simple fixed maze. Wide rooms + chokepoints to feel like tunnels under Alcatraz.
const RAW_MAP = [
  '########################',
  '#....#.....#....#......#',
  '#.##.#.###.#.##.#.####.#',
  '#.#..#...#.#.#..#....#.#',
  '#.#.####.#.#.#.#####.#.#',
  '#.#....#.#.#.#.....#.#.#',
  '#.####.#.#.#.#####.#.#.#',
  '#......#...#.....#.#...#',
  '######.#####.###.#.###.#',
  '#....#.....#.#...#.#...#',
  '#.##.#####.#.#.###.#.###',
  '#..#.....#.#.#.....#...#',
  '##.#####.#.#.#########.#',
  '#......#.#.#.........#.#',
  '####.#.#.#.#########.#.#',
  '#....#.#.#.....#.....#.#',
  '#.####.#.#####.#.#####.#',
  '#.#....#.....#.#.....#.#',
  '#.#.#########.#.###.#.#.',
  '#.#...........#...#.#..E',
  '########################',
] as const

function buildMap(): { grid: MapGrid; start: Vec; exit: Vec } {
  const grid: MapGrid = RAW_MAP.map(row =>
    row.split('').map(ch => (ch === '#' ? '#' : ch === 'E' ? 'E' : '.')) as Tile[]
  )
  // pick a start tile near top-left that's floor
  let start: Vec = { x: 1, y: 1 }
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] === '.') { start = { x, y }; y = grid.length; break }
    }
  }
  // find exit (single E)
  let exit = { x: 0, y: 0 }
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] === 'E') exit = { x, y }
    }
  }
  return { grid, start, exit }
}

function manhattan(a: Vec, b: Vec) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function pickRandomFloors(grid: MapGrid, n: number, exclude: Vec[]): Vec[] {
  const floors: Vec[] = []
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] === '.') floors.push({ x, y })
    }
  }
  const key = (v: Vec) => `${v.x},${v.y}`
  const excluded = new Set(exclude.map(key))
  const picks: Vec[] = []
  while (picks.length < n && floors.length) {
    const idx = Math.floor(Math.random() * floors.length)
    const v = floors.splice(idx, 1)[0]
    if (excluded.has(key(v))) continue
    picks.push(v)
  }
  return picks
}

function isMobileLike() {
  return matchMedia && matchMedia('(pointer: coarse)').matches
}

export default function TunnelsGame() {
  // world
  const base = useMemo(buildMap, [])
  const [grid] = useState<MapGrid>(base.grid)
  const [player, setPlayer] = useState<Vec>(base.start)
  const [exit] = useState<Vec>(base.exit)
  const [supplies, setSupplies] = useState<Vec[]>(() =>
    pickRandomFloors(grid, SUPPLY_COUNT, [player, exit])
  )
  const [guards, setGuards] = useState<Vec[]>(() =>
    pickRandomFloors(grid, GUARD_COUNT, [player, exit, ...supplies])
  )
  const [collected, setCollected] = useState(0)
  const [steps, setSteps] = useState(0)
  const [gameOver, setGameOver] = useState<null | 'caught' | 'escaped' | 'exhausted'>(null)

  // input
  const [showPad, setShowPad] = useState(isMobileLike())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // movement + collisions
  const canWalk = (v: Vec) =>
    v.y >= 0 && v.y < grid.length && v.x >= 0 && v.x < grid[0].length && grid[v.y][v.x] !== '#'

  function tryMove(dir: Vec) {
    if (gameOver) return
    const next = { x: player.x + dir.x, y: player.y + dir.y }
    if (!canWalk(next)) return
    setPlayer(next)
    setSteps(s => s + 1)
    // supplies pickup
    setSupplies(prev => {
      const left = prev.filter(sup => !(sup.x === next.x && sup.y === next.y))
      if (left.length !== prev.length) setCollected(c => c + 1)
      return left
    })
  }

  // keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key
      let d: Vec | null = null
      if (k === 'ArrowUp' || k === 'w') d = { x: 0, y: -1 }
      if (k === 'ArrowDown' || k === 's') d = { x: 0, y: 1 }
      if (k === 'ArrowLeft' || k === 'a') d = { x: -1, y: 0 }
      if (k === 'ArrowRight' || k === 'd') d = { x: 1, y: 0 }
      if (d) { e.preventDefault(); tryMove(d) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [player, gameOver])

  // swipe input (mobile)
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    let sx = 0, sy = 0, dx = 0, dy = 0, dragging = false
    const start = (c: Touch | MouseEvent) => { sx = 'clientX' in c ? c.clientX : 0; sy = 'clientY' in c ? c.clientY : 0; dragging = true }
    const move = (c: Touch | MouseEvent) => { if (!dragging) return; dx = ('clientX' in c ? c.clientX : 0) - sx; dy = ('clientY' in c ? c.clientY : 0) - sy }
    const end = () => {
      if (!dragging) return
      dragging = false
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return
      if (Math.abs(dx) > Math.abs(dy)) tryMove({ x: dx > 0 ? 1 : -1, y: 0 })
      else tryMove({ x: 0, y: dy > 0 ? 1 : -1 })
      dx = dy = 0
    }
    const tstart = (e: TouchEvent) => start(e.touches[0])
    const tmove = (e: TouchEvent) => move(e.touches[0])
    const tend = () => end()
    const mstart = (e: MouseEvent) => start(e)
    const mmove = (e: MouseEvent) => move(e)
    const mend = () => end()
    el.addEventListener('touchstart', tstart); el.addEventListener('touchmove', tmove); el.addEventListener('touchend', tend)
    el.addEventListener('mousedown', mstart); el.addEventListener('mousemove', mmove); window.addEventListener('mouseup', mend)
    return () => {
      el.removeEventListener('touchstart', tstart); el.removeEventListener('touchmove', tmove); el.removeEventListener('touchend', tend)
      el.removeEventListener('mousedown', mstart); el.removeEventListener('mousemove', mmove); window.removeEventListener('mouseup', mend)
    }
  }, [player, gameOver])

  // guards simple pathing: drift toward player with randomness; speed up after step limit
  useEffect(() => {
    if (gameOver) return
    const speed = steps > STEP_LIMIT ? 120 : 220
    const id = setInterval(() => {
      setGuards(prev => prev.map(g => {
        const opts: Vec[] = []
        ;[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].forEach(d => {
          const n = { x: g.x + d.x, y: g.y + d.y }
          if (canWalk(n)) opts.push(n)
        })
        if (!opts.length) return g
        // bias toward player
        opts.sort((a,b) => manhattan(a, player) - manhattan(b, player))
        const choice = Math.random() < 0.7 ? opts[0] : opts[Math.floor(Math.random()*Math.min(3, opts.length))]
        return choice
      }))
    }, speed)
    return () => clearInterval(id)
  }, [player, steps, gameOver])

  // win/lose checks
  useEffect(() => {
    if (gameOver) return
    for (const g of guards) {
      if (g.x === player.x && g.y === player.y) { setGameOver('caught'); return }
    }
    if (collected === SUPPLY_COUNT && player.x === exit.x && player.y === exit.y) {
      setGameOver('escaped')
    }
    if (steps > STEP_LIMIT + 150) setGameOver('exhausted')
  }, [player, guards, collected, steps, gameOver, exit])

  // draw
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const W = grid[0].length * TILE
    const H = grid.length * TILE
    cvs.width = W
    cvs.height = H
    const ctx = cvs.getContext('2d')!
    // background
    ctx.fillStyle = '#0a0f14'
    ctx.fillRect(0, 0, W, H)

    // tiles
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const visible = manhattan({x,y}, player) <= FOG_RADIUS
        const t = grid[y][x]
        if (!visible) {
          ctx.fillStyle = '#05070a'
          ctx.fillRect(x*TILE, y*TILE, TILE, TILE)
          continue
        }
        if (t === '#') {
          ctx.fillStyle = '#1e2a33'
          ctx.fillRect(x*TILE, y*TILE, TILE, TILE)
          // wall texture
          ctx.fillStyle = '#243744'
          ctx.fillRect(x*TILE, y*TILE+TILE-6, TILE, 2)
        } else if (t === 'E') {
          ctx.fillStyle = collected === SUPPLY_COUNT ? '#1db954' : '#333'
          ctx.fillRect(x*TILE+3, y*TILE+3, TILE-6, TILE-6)
        } else {
          ctx.fillStyle = '#0f181f'
          ctx.fillRect(x*TILE, y*TILE, TILE, TILE)
          ctx.fillStyle = '#0c141a'
          ctx.fillRect(x*TILE+4, y*TILE+4, TILE-8, TILE-8)
        }
      }
    }

    // supplies
    supplies.forEach(s => {
      if (manhattan(s, player) > FOG_RADIUS) return
      const cx = s.x*TILE + TILE/2
      const cy = s.y*TILE + TILE/2
      ctx.beginPath()
      ctx.arc(cx, cy, 6, 0, Math.PI*2)
      ctx.fillStyle = '#39ff14'
      ctx.fill()
      ctx.strokeStyle = 'rgba(57,255,20,0.3)'
      ctx.lineWidth = 4
      ctx.stroke()
    })

    // guards
    guards.forEach(g => {
      if (manhattan(g, player) > FOG_RADIUS) return
      ctx.fillStyle = '#c0392b'
      ctx.fillRect(g.x*TILE+5, g.y*TILE+5, TILE-10, TILE-10)
      ctx.fillStyle = '#e74c3c'
      ctx.fillRect(g.x*TILE+9, g.y*TILE+9, TILE-18, TILE-18)
    })

    // player
    ctx.fillStyle = '#f1c40f'
    ctx.fillRect(player.x*TILE+4, player.y*TILE+4, TILE-8, TILE-8)
    ctx.fillStyle = '#ffd657'
    ctx.fillRect(player.x*TILE+8, player.y*TILE+8, TILE-16, TILE-16)

    // vignette
    const grad = ctx.createRadialGradient(
      player.x*TILE+TILE/2, player.y*TILE+TILE/2, TILE*FOG_RADIUS*0.4,
      player.x*TILE+TILE/2, player.y*TILE+TILE/2, TILE*FOG_RADIUS*1.1
    )
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = grad
    ctx.fillRect(0,0,W,H)

  }, [grid, player, supplies, guards, collected])

  function reset() {
    const fresh = buildMap()
    setPlayer(fresh.start)
    setSupplies(pickRandomFloors(grid, SUPPLY_COUNT, [fresh.start, fresh.exit]))
    setGuards(pickRandomFloors(grid, GUARD_COUNT, [fresh.start, fresh.exit]))
    setCollected(0)
    setSteps(0)
    setGameOver(null)
  }

  const canExit = collected === SUPPLY_COUNT

  return (
    <section className="container my-5">
      <div className="row align-items-center g-4">
        <div className="col-12 col-lg-7">
          <div className="tunnels-wrap p-2 border rounded-3 bg-dark position-relative">
            <canvas
              ref={canvasRef}
              className="w-100"
              style={{ imageRendering: 'pixelated', transform: `scale(${VIEW_SCALE})`, transformOrigin: 'top left' }}
              aria-label="Tunnels game canvas"
              role="img"
            />
            {showPad && !gameOver && (
              <div className="position-absolute bottom-0 end-0 p-2 d-flex flex-column align-items-end gap-2">
                <div className="d-flex align-items-center justify-content-center">
                  <button className="btn btn-outline-light btn-sm mx-1 opacity-75" onClick={() => tryMove({x:0,y:-1})}>▲</button>
                </div>
                <div className="d-flex align-items-center justify-content-center">
                  <button className="btn btn-outline-light btn-sm mx-1 opacity-75" onClick={() => tryMove({x:-1,y:0})}>◀</button>
                  <button className="btn btn-outline-light btn-sm mx-1 opacity-75" onClick={() => tryMove({x:1,y:0})}>▶</button>
                </div>
                <div className="d-flex align-items-center justify-content-center">
                  <button className="btn btn-outline-light btn-sm mx-1 opacity-75" onClick={() => tryMove({x:0,y:1})}>▼</button>
                </div>
              </div>
            )}
            {gameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ background: 'rgba(0,0,0,0.7)' }}
              >
                <div className="text-center text-light">
                  <h3 className="mb-3" style={{ fontFamily: 'VT323, monospace', fontSize: 40 }}>
                    {gameOver === 'escaped' ? 'Extraction successful.' :
                     gameOver === 'caught' ? 'Captured by guards.' :
                     'You ran out of time.'}
                  </h3>
                  <p className="text-secondary mb-3">Supplies collected: {collected} / {SUPPLY_COUNT}</p>
                  <button className="btn btn-success me-2" onClick={reset}>Play again</button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card bg-body-tertiary">
            <div className="card-body">
              <h5 className="card-title" style={{ fontFamily: 'Oxanium, sans-serif' }}>Tunnels: Supply Run</h5>
              <p className="card-text">
                Navigate the tunnels, collect all supplies, then reach the exit hatch. Guards patrol. Stay in the dark; move smart.
              </p>
              <ul className="small mb-3">
                <li>Desktop: Arrow keys or WASD</li>
                <li>Mobile: Swipe on the map or use the D-pad</li>
                <li>Fog of war limits what you can see</li>
                <li>Exit unlocks after all supplies are collected</li>
              </ul>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="badge text-bg-success">Supplies {collected}/{SUPPLY_COUNT}</span>
                <span className={`badge ${steps > STEP_LIMIT ? 'text-bg-danger' : 'text-bg-secondary'}`}>
                  Steps {steps}
                </span>
                <span className={`badge ${canExit ? 'text-bg-success' : 'text-bg-dark'}`}>
                  Exit {canExit ? 'unlocked' : 'locked'}
                </span>
                <button className="btn btn-outline-secondary btn-sm ms-auto" onClick={() => setShowPad(s => !s)}>
                  {showPad ? 'Hide D-pad' : 'Show D-pad'}
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={reset}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}