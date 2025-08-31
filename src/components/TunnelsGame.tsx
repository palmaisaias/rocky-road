import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Vec = { x: number; y: number }
type Tile = '#' | '.' | 'E'
type MapGrid = Tile[][]

const TILE = 24
const FOG_RADIUS = 4
const SUPPLY_COUNT = 6
const GUARD_COUNT = 2
const STEP_LIMIT = 400

// Fixed maze with wide rooms + chokepoints
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

const key = (v: Vec) => `${v.x},${v.y}`

function safeIsMobileLike() {
  if (typeof window === 'undefined') return false
  if (!('matchMedia' in window)) return false
  return window.matchMedia('(pointer: coarse)').matches
}

function manhattan(a: Vec, b: Vec) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function neighbors(v: Vec): Vec[] {
  return [
    { x: v.x + 1, y: v.y },
    { x: v.x - 1, y: v.y },
    { x: v.x, y: v.y + 1 },
    { x: v.x, y: v.y - 1 },
  ]
}

function passable(t: Tile) { return t !== '#' }

function floodFrom(start: Vec, grid: MapGrid): Set<string> {
  const seen = new Set<string>()
  const q: Vec[] = [start]
  const H = grid.length, W = grid[0].length
  while (q.length) {
    const v = q.shift()!
    const k = key(v)
    if (seen.has(k)) continue
    if (v.x < 0 || v.x >= W || v.y < 0 || v.y >= H) continue
    if (!passable(grid[v.y][v.x])) continue
    seen.add(k)
    for (const n of neighbors(v)) q.push(n)
  }
  return seen
}

function findExit(grid: MapGrid): Vec {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] === 'E') return { x, y }
    }
  }
  return { x: 0, y: 0 }
}

// A*: floors cost 1, walls cost 5 — carves a minimal corridor
function pathToRegion(start: Vec, targets: Vec[], grid: MapGrid): Vec[] | null {
  const goals = new Set(targets.map(key))
  const W = grid[0].length, H = grid.length

  const g = new Map<string, number>()
  const came = new Map<string, string | null>()
  type Node = { f: number; g: number; v: Vec }
  const open: Node[] = []

  const cost = (x: number, y: number) => (grid[y][x] === '#' ? 5 : 1)
  const h = (x: number, y: number) =>
    Math.min(...targets.map(t => Math.abs(t.x - x) + Math.abs(t.y - y)))

  const sk = key(start)
  g.set(sk, 0)
  open.push({ f: h(start.x, start.y), g: 0, v: start })
  came.set(sk, null)

  const popMin = () => {
    let mi = 0
    for (let i = 1; i < open.length; i++) if (open[i].f < open[mi].f) mi = i
    return open.splice(mi, 1)[0]
  }

  const seen = new Set<string>()
  while (open.length) {
    const cur = popMin()
    const ck = key(cur.v)
    if (seen.has(ck)) continue
    seen.add(ck)
    if (goals.has(ck)) {
      const path: Vec[] = []
      let k: string | null = ck
      while (k) {
        const [xs, ys] = k.split(',').map(Number)
        path.push({ x: xs, y: ys })
        k = came.get(k) ?? null
      }
      path.reverse()
      return path
    }
    for (const n of neighbors(cur.v)) {
      if (n.x < 0 || n.x >= W || n.y < 0 || n.y >= H) continue
      const nk = key(n)
      const tentative = cur.g + cost(n.x, n.y)
      if (tentative < (g.get(nk) ?? Infinity)) {
        g.set(nk, tentative)
        came.set(nk, ck)
        open.push({ f: tentative + h(n.x, n.y), g: tentative, v: n })
      }
    }
  }
  return null
}

function buildMap(): {
  grid: MapGrid
  start: Vec
  exit: Vec
  connected: Set<string>
  connectedCells: Vec[]
} {
  // clone + normalize
  const grid: MapGrid = RAW_MAP.map(row =>
    row.split('').map(ch => (ch === '#' ? '#' : ch === 'E' ? 'E' : '.')) as Tile[]
  )

  const H = grid.length, W = grid[0].length
  const exit = findExit(grid)

  // find all passable components
  const visited = new Set<string>()
  const components: Vec[][] = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = `${x},${y}`
      if (visited.has(k)) continue
      if (!passable(grid[y][x])) continue
      const seen = floodFrom({ x, y }, grid)
      seen.forEach(s => visited.add(s))
      components.push(Array.from(seen).map(s => {
        const [sx, sy] = s.split(',').map(Number)
        return { x: sx, y: sy }
      }))
    }
  }

  // choose the largest open region
  let largest = components[0] ?? []
  for (const c of components) if (c.length > largest.length) largest = c

  // if exit isn’t in the largest region, carve a minimal corridor into it
  const exitInLargest = largest.some(v => v.x === exit.x && v.y === exit.y)
  if (!exitInLargest && largest.length) {
    const p = pathToRegion(exit, largest, grid)
    if (p) {
      for (const v of p) {
        if (grid[v.y][v.x] === '#') grid[v.y][v.x] = '.' // carve
      }
    }
  }

  // recompute the connected region from the exit (now bridged)
  const connected = floodFrom(exit, grid)
  const connectedCells: Vec[] = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== '#' && connected.has(key({ x, y }))) {
        connectedCells.push({ x, y })
      }
    }
  }

  // pick a start near top-left that’s in the connected region
  let start: Vec = { x: 1, y: 1 }
  outer: for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (grid[y][x] !== '#' && connected.has(key({ x, y }))) {
        start = { x, y }
        break outer
      }
    }
  }

  return { grid, start, exit, connected, connectedCells }
}

function pickRandom(
  cells: Vec[],
  n: number,
  exclude: Vec[] = []
): Vec[] {
  const ex = new Set(exclude.map(key))
  const pool = cells.filter(v => !ex.has(key(v)))
  const picks: Vec[] = []
  while (picks.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length)
    picks.push(pool.splice(i, 1)[0])
  }
  return picks
}

export default function TunnelsGame() {
  // world (built once; includes connectivity patch)
  const base = useMemo(buildMap, [])
  const [grid] = useState<MapGrid>(base.grid)
  const [player, setPlayer] = useState<Vec>(base.start)
  const [exit] = useState<Vec>(base.exit)
  const [connected] = useState<Set<string>>(base.connected)
  const [connectedCells] = useState<Vec[]>(base.connectedCells)

  // entities only spawn on connected tiles (guaranteed winnable)
  const walkableConnected = useMemo(
    () => connectedCells.filter(v => grid[v.y][v.x] === '.' || grid[v.y][v.x] === 'E'),
    [connectedCells, grid]
  )

  const [supplies, setSupplies] = useState<Vec[]>(() =>
    pickRandom(walkableConnected.filter(v => grid[v.y][v.x] === '.'), SUPPLY_COUNT, [player, exit])
  )
  const [guards, setGuards] = useState<Vec[]>(() =>
    pickRandom(walkableConnected.filter(v => grid[v.y][v.x] === '.'), GUARD_COUNT, [player, exit, ...supplies])
  )

  const [collected, setCollected] = useState(0)
  const [steps, setSteps] = useState(0)
  const [gameOver, setGameOver] = useState<null | 'caught' | 'escaped' | 'exhausted'>(null)

  const [showPad, setShowPad] = useState(safeIsMobileLike())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const canWalk = (v: Vec) =>
    v.y >= 0 &&
    v.y < grid.length &&
    v.x >= 0 &&
    v.x < grid[0].length &&
    grid[v.y][v.x] !== '#'

  function tryMove(dir: Vec) {
    if (gameOver) return
    const next = { x: player.x + dir.x, y: player.y + dir.y }
    if (!canWalk(next)) return
    setPlayer(next)
    setSteps(s => s + 1)
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

  // swipe / drag
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    let sx = 0, sy = 0, dx = 0, dy = 0, dragging = false
    const start = (c: Touch | MouseEvent) => {
      // @ts-expect-error touch union
      const cx = 'clientX' in c ? c.clientX : (c?.pageX ?? 0)
      // @ts-expect-error touch union
      const cy = 'clientY' in c ? c.clientY : (c?.pageY ?? 0)
      sx = cx; sy = cy; dragging = true
    }
    const move = (c: Touch | MouseEvent) => {
      if (!dragging) return
      // @ts-expect-error touch union
      const cx = 'clientX' in c ? c.clientX : (c?.pageX ?? 0)
      // @ts-expect-error touch union
      const cy = 'clientY' in c ? c.clientY : (c?.pageY ?? 0)
      dx = cx - sx; dy = cy - sy
    }
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
    el.addEventListener('touchstart', tstart, { passive: true })
    el.addEventListener('touchmove', tmove, { passive: true })
    el.addEventListener('touchend', tend)
    el.addEventListener('mousedown', mstart)
    el.addEventListener('mousemove', mmove)
    window.addEventListener('mouseup', mend)
    return () => {
      el.removeEventListener('touchstart', tstart)
      el.removeEventListener('touchmove', tmove)
      el.removeEventListener('touchend', tend)
      el.removeEventListener('mousedown', mstart)
      el.removeEventListener('mousemove', mmove)
      window.removeEventListener('mouseup', mend)
    }
  }, [player, gameOver])

  // guards simple pathing toward player; speed up after step limit
  useEffect(() => {
    if (gameOver) return
    const speed = steps > STEP_LIMIT ? 120 : 220
    const id = setInterval(() => {
      setGuards(prev => prev.map(g => {
        const opts: Vec[] = []
        ;[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].forEach(d => {
          const n = { x: g.x + d.x, y: g.y + d.y }
          if (canWalk(n) && connected.has(key(n))) opts.push(n)
        })
        if (!opts.length) return g
        opts.sort((a,b) => manhattan(a, player) - manhattan(b, player))
        const choice = Math.random() < 0.7 ? opts[0] : opts[Math.floor(Math.random()*Math.min(3, opts.length))]
        return choice
      }))
    }, speed)
    return () => clearInterval(id)
  }, [player, steps, gameOver, connected])

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

  // draw (crisp + responsive: DPR-scaled, CSS width 100%)
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const W = grid[0].length * TILE
    const H = grid.length * TILE
    const DPR = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1
    cvs.width = Math.floor(W * DPR)
    cvs.height = Math.floor(H * DPR)
    const ctx = cvs.getContext('2d')!
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

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
    const newPlayer = base.start
    const newSupplies = pickRandom(
      walkableConnected.filter(v => grid[v.y][v.x] === '.'),
      SUPPLY_COUNT,
      [newPlayer, exit]
    )
    const newGuards = pickRandom(
      walkableConnected.filter(v => grid[v.y][v.x] === '.'),
      GUARD_COUNT,
      [newPlayer, exit, ...newSupplies]
    )
    setPlayer(newPlayer)
    setSupplies(newSupplies)
    setGuards(newGuards)
    setCollected(0)
    setSteps(0)
    setGameOver(null)
  }

  const canExit = collected === SUPPLY_COUNT
  const PIX_W = grid[0].length * TILE
  const PIX_H = grid.length * TILE

  return (
    <section className="container my-5">
      <div className="row align-items-center g-4">
        <div className="col-12 col-lg-7">
          <div className="tunnels-wrap p-2 border rounded-3 bg-dark position-relative">
            <canvas
              ref={canvasRef}
              // responsive: fits column width, keeps aspect
              style={{ width: '100%', height: 'auto', imageRendering: 'pixelated' }}
              width={PIX_W}
              height={PIX_H}
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
                Collect all supplies, then hit the hatch. Guards patrol. Stay in the dark; move smart.
              </p>
              <ul className="small mb-3">
                <li>Desktop: Arrow keys or WASD</li>
                <li>Mobile: Swipe or use the D-pad</li>
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
