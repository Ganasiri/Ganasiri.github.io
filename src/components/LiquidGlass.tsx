import { useEffect } from 'react'

/** Width of the curved edge, in CSS pixels, where the backdrop bends. */
const BEZEL = 24
/** feDisplacementMap scale; the furthest the edge pulls is half of this. */
const STRENGTH = 56
/** Maps are drawn at half size and stretched; they are smooth anyway. */
const MAP_SCALE = 0.5
const SVG_NS = 'http://www.w3.org/2000/svg'

type UAData = { brands?: { brand: string }[] }

/** SVG filters inside backdrop-filter only render in Chromium browsers. */
function supportsRefraction() {
  const brands = (navigator as Navigator & { userAgentData?: UAData }).userAgentData?.brands
  return (
    !!brands?.some((b) => b.brand === 'Chromium') &&
    !matchMedia('(prefers-reduced-transparency: reduce)').matches
  )
}

/**
 * Draws a displacement map for a rounded rectangle. Red and green hold the
 * x and y offsets (128 is no offset). Inside the bezel, pixels pull from
 * further in, strongest at the rim, so the edge reads as thick curved glass.
 * Sampling inwards never reaches outside the element, so edges stay clean.
 */
function drawMap(width: number, height: number, radius: number) {
  const w = Math.max(1, Math.round(width * MAP_SCALE))
  const h = Math.max(1, Math.round(height * MAP_SCALE))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const image = ctx.createImageData(w, h)
  const data = image.data

  const r = Math.min(radius, width / 2, height / 2)
  const halfW = width / 2
  const halfH = height / 2
  const bezel = Math.min(BEZEL, halfW, halfH)

  for (let j = 0; j < h; j++) {
    const y = (j + 0.5) / MAP_SCALE - halfH
    for (let i = 0; i < w; i++) {
      const x = (i + 0.5) / MAP_SCALE - halfW
      // Signed distance to the rounded rectangle's edge (negative inside).
      const qx = Math.abs(x) - (halfW - r)
      const qy = Math.abs(y) - (halfH - r)
      let nx = 0
      let ny = 0
      let depth: number
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy) || 1
        depth = r - len
        nx = (qx / len) * Math.sign(x)
        ny = (qy / len) * Math.sign(y)
      } else if (qx > qy) {
        depth = r - qx
        nx = Math.sign(x)
      } else {
        depth = r - qy
        ny = Math.sign(y)
      }
      const t = Math.min(1, Math.max(0, 1 - depth / bezel))
      // Eased so the bend builds smoothly towards the rim, like a meniscus.
      const pull = t * t * (3 - 2 * t)
      const k = (j * w + i) * 4
      data[k] = 128 - nx * pull * 127
      data[k + 1] = 128 - ny * pull * 127
      data[k + 2] = 128
      data[k + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL()
}

function createFilter(defs: SVGDefsElement, id: string) {
  const filter = document.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', id)
  filter.setAttribute('color-interpolation-filters', 'sRGB')
  const map = document.createElementNS(SVG_NS, 'feImage')
  map.setAttribute('x', '0')
  map.setAttribute('y', '0')
  map.setAttribute('preserveAspectRatio', 'none')
  map.setAttribute('result', 'map')
  const displace = document.createElementNS(SVG_NS, 'feDisplacementMap')
  displace.setAttribute('in', 'SourceGraphic')
  displace.setAttribute('in2', 'map')
  displace.setAttribute('scale', String(STRENGTH))
  displace.setAttribute('xChannelSelector', 'R')
  displace.setAttribute('yChannelSelector', 'G')
  filter.append(map, displace)
  defs.append(filter)
  return map
}

/** Gives every .glass surface a light that follows the pointer and a soft,
 *  springy lean towards it; .glass-blur surfaces also refract their edges. */
export function LiquidGlass() {
  // Refraction for the blurred glass.
  useEffect(() => {
    if (!supportsRefraction()) return
    const root = document.documentElement
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.style.position = 'absolute'
    const defs = document.createElementNS(SVG_NS, 'defs')
    svg.append(defs)
    document.body.append(svg)
    root.classList.add('has-refraction')

    const maps = new Map<HTMLElement, { image: SVGFEImageElement; key: string }>()
    let count = 0

    const update = (el: HTMLElement) => {
      const entry = maps.get(el)
      if (!entry) return
      // Layout size, so scroll-driven scaling doesn't redraw the map.
      const width = el.offsetWidth
      const height = el.offsetHeight
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
      const key = `${width}x${height}r${radius}`
      if (!width || !height || key === entry.key) return
      entry.key = key
      entry.image.setAttribute('width', String(width))
      entry.image.setAttribute('height', String(height))
      entry.image.setAttribute('href', drawMap(width, height, radius))
    }

    const resizer = new ResizeObserver((entries) => {
      entries.forEach((e) => update(e.target as HTMLElement))
    })

    const scan = () => {
      document.querySelectorAll<HTMLElement>('.glass-blur').forEach((el) => {
        if (maps.has(el)) return
        const id = `liquid-glass-${count++}`
        maps.set(el, { image: createFilter(defs, id), key: '' })
        el.style.setProperty('--glass-refract', `url(#${id})`)
        resizer.observe(el)
      })
    }
    scan()
    const watcher = new MutationObserver(scan)
    watcher.observe(document.body, { childList: true, subtree: true })

    return () => {
      watcher.disconnect()
      resizer.disconnect()
      maps.forEach((_, el) => el.style.removeProperty('--glass-refract'))
      svg.remove()
      root.classList.remove('has-refraction')
    }
  }, [])

  // Pointer light and lean.
  useEffect(() => {
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)')
    const motionOk = matchMedia('(prefers-reduced-motion: no-preference)')
    let current: HTMLElement | null = null
    let frame = 0
    let last: PointerEvent | null = null

    const release = (el: HTMLElement) => {
      el.classList.remove('is-lit')
      el.style.removeProperty('translate')
      el.style.removeProperty('scale')
    }

    const apply = () => {
      frame = 0
      if (!current || !last) return
      const rect = current.getBoundingClientRect()
      const x = last.clientX - rect.left
      const y = last.clientY - rect.top
      current.style.setProperty('--lx', `${x}px`)
      current.style.setProperty('--ly', `${y}px`)
      if (!motionOk.matches) return
      // Lean a few pixels towards the pointer and swell slightly; the size
      // of the swell shrinks with the surface, so big panels barely grow.
      const nx = x / rect.width - 0.5
      const ny = y / rect.height - 0.5
      const lean = current.classList.contains('magnetic') ? 0 : 6
      current.style.translate = `${(nx * lean).toFixed(2)}px ${(ny * lean).toFixed(2)}px`
      const swell = Math.min(0.03, 14 / Math.max(rect.width, rect.height))
      current.style.scale = String(1 + swell)
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) return
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('.glass') : null
      if (target !== current) {
        if (current) release(current)
        current = target
        current?.classList.add('is-lit')
      }
      last = event
      if (current && !frame) frame = requestAnimationFrame(apply)
    }

    const onLeave = () => {
      if (current) release(current)
      current = null
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      onLeave()
      document.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  return null
}
