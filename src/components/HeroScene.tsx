import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three'
import { gsap, ScrollTrigger } from '../lib/gsap'

type Props = {
  /** Called after the first frame renders, or straight away without WebGL. */
  onReady: () => void
  /** Scrolling through this element lifts the camera to a top-down view. */
  morphTrigger: string
  /** The scene fades out as this element scrolls up into view. */
  fadeTrigger: string
  reducedMotion: boolean
}

/** Field size in world units, wide enough that its sides stay off screen. */
const WIDTH = 30
const NEAR_Z = 3
const FAR_Z = -19
const f = (n: number) => n.toFixed(2)

/** Camera at the start (a low view over the field) and after scrolling. */
const VIEWS = {
  wide: { position: new Vector3(0, 2.1, 7.2), target: new Vector3(0, 1.45, -4) },
  // Phones look down a little more, so the horizon sits just under the
  // copy that stacks at the top of the screen.
  narrow: { position: new Vector3(0, 2.4, 8.2), target: new Vector3(0, 0.9, -4) },
  top: { position: new Vector3(0, 10.5, 3.2), target: new Vector3(0, 0, -2.6) },
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFlatten;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vHeat;
  varying float vAlpha;
  varying float vScan;

  // A slowly drifting data surface made of a few interfering waves.
  float surface(vec2 p, float t) {
    return 0.62 * sin(p.x * 0.32 + t * 0.30) * cos(p.y * 0.38 - t * 0.22)
         + 0.28 * sin(p.x * 0.71 + p.y * 0.53 - t * 0.45)
         + 0.10 * sin(p.x * 1.60 - t * 0.70) * sin(p.y * 1.30 + t * 0.50);
  }

  void main() {
    vec3 p = position;
    float h = surface(p.xz, uTime);
    p.y = h * mix(1.0, 0.4, uFlatten);
    vHeat = smoothstep(-0.3, 0.75, h);

    // A bright band rolls across the field from the horizon to the viewer.
    float span = ${f(NEAR_Z - FAR_Z + 8)};
    float bandZ = ${f(FAR_Z - 4)} + mod(uTime * 2.6, span);
    vScan = exp(-pow((p.z - bandZ) * 0.85, 2.0));

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float depth = -mvPosition.z;
    float size = uSize * uPixelRatio * (0.75 + aSeed * 0.5) * (1.0 + vScan * 0.7) / depth;
    gl_PointSize = min(size, 7.0 * uPixelRatio);

    // Fade into the distance and towards the side edges.
    float far = 1.0 - smoothstep(10.0, 21.0, depth);
    float side = 1.0 - smoothstep(${f(WIDTH / 2 - 6)}, ${f(WIDTH / 2)}, abs(position.x));
    vAlpha = far * side;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uMid;
  uniform vec3 uHigh;
  uniform vec3 uPop;
  varying float vHeat;
  varying float vAlpha;
  varying float vScan;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, d);
    // Light on dark: dim slate valleys, off-white peaks, like a heatmap.
    vec3 color = mix(uLow, uMid, smoothstep(0.0, 0.6, vHeat));
    color = mix(color, uHigh, smoothstep(0.6, 1.0, vHeat));
    // The rolling band is steel blue, the page's pop colour.
    color = mix(color, uPop, vScan * 0.9);
    // Kept low so the glow stays calm rather than bright.
    float alpha = soft * vAlpha * (0.22 + vHeat * 0.48 + vScan * 0.4);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`

function createField(cols: number, rows: number) {
  const count = cols * rows
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col
      positions[i * 3] = (col / (cols - 1) - 0.5) * WIDTH
      positions[i * 3 + 2] = FAR_Z + (row / (rows - 1)) * (NEAR_Z - FAR_Z)
      seeds[i] = Math.random()
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
  return geometry
}

/**
 * A landscape of data points, a live 3D surface chart, that the hero name
 * stands on. Scrolling lifts the camera until the field reads as a flat
 * heatmap, then it fades out with the About section. Rendering pauses once
 * it's out of view.
 */
export default function HeroScene({ onReady, morphTrigger, fadeTrigger, reducedMotion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    } catch {
      onReady() // No WebGL: the page works fine without the scene.
      return
    }

    const small = window.matchMedia('(max-width: 767px)').matches
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    renderer.setPixelRatio(pixelRatio)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const scene = new Scene()
    const camera = new PerspectiveCamera(40, 1, 0.1, 60)

    const geometry = small ? createField(150, 80) : createField(300, 120)
    const uniforms = {
      uTime: { value: 0 },
      uFlatten: { value: 0 },
      uSize: { value: small ? 34 : 30 },
      uPixelRatio: { value: pixelRatio },
      uLow: { value: new Color('#414958') },
      uMid: { value: new Color('#8d96a6') },
      uHigh: { value: new Color('#e6e3dc') },
      uPop: { value: new Color('#6a90b4') },
    }
    // Additive blending: on the dark page, dots glow where they gather.
    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    scene.add(new Points(geometry, material))

    const pointer = { x: 0, y: 0 }
    const sway = { x: 0, y: 0 }
    const position = new Vector3()
    const target = new Vector3()

    const render = () => {
      const t = uniforms.uFlatten.value
      const start = camera.aspect < 1 ? VIEWS.narrow : VIEWS.wide
      position.lerpVectors(start.position, VIEWS.top.position, t)
      target.lerpVectors(start.target, VIEWS.top.target, t)
      // A little parallax with the mouse, strongest in the low view.
      position.x += sway.x * (1 - t * 0.6)
      position.y += sway.y * (1 - t)
      camera.position.copy(position)
      camera.lookAt(target)
      renderer.render(scene, camera)
    }

    const resize = () => {
      const width = container.clientWidth || window.innerWidth
      const height = container.clientHeight || window.innerHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      render()
    }

    let visibility: ScrollTrigger | undefined
    const ctx = gsap.context(() => {
      const heroRange = { trigger: morphTrigger, start: 'top top', end: 'bottom top', scrub: true }
      if (!reducedMotion) {
        gsap.to(uniforms.uFlatten, { value: 1, ease: 'power1.inOut', scrollTrigger: heroRange })
      }
      // Without the camera move there's nothing to show behind About.
      gsap.to(container, { opacity: reducedMotion ? 0 : 0.45, ease: 'none', scrollTrigger: heroRange })
      // Gone by the time the fade element is halfway up, so text there is clean.
      gsap.to(renderer.domElement, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: fadeTrigger, start: 'top bottom', end: 'top 50%', scrub: true },
      })
      visibility = ScrollTrigger.create({
        trigger: morphTrigger,
        start: 'top bottom',
        endTrigger: fadeTrigger,
        end: 'top 50%',
        onToggle: (self) => {
          if (self.isActive && reducedMotion) render()
        },
      })
    })

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }

    const tick = (_time: number, deltaTime: number) => {
      if (!visibility?.isActive) return
      uniforms.uTime.value += Math.min(deltaTime, 50) / 1000
      sway.x += (pointer.x * 0.9 - sway.x) * 0.04
      sway.y += (-pointer.y * 0.25 - sway.y) * 0.04
      render()
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    onReady()

    if (!reducedMotion) {
      gsap.ticker.add(tick)
      window.addEventListener('pointermove', onPointerMove, { passive: true })
    }

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onPointerMove)
      observer.disconnect()
      ctx.revert()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [onReady, morphTrigger, fadeTrigger, reducedMotion])

  return <div ref={containerRef} className="hero-scene" aria-hidden="true" />
}
