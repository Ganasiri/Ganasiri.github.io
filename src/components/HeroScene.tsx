import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Plane,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
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
/** The pointer reaches no further back than this, where dots still show. */
const REACH_Z = -9
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
  uniform vec2 uPointer;
  uniform float uStir;
  attribute float aSeed;
  varying float vHeat;
  varying float vAlpha;
  varying float vScan;
  varying float vGlow;

  // A slowly drifting data surface made of a few interfering waves.
  float surface(vec2 p, float t) {
    return 0.62 * sin(p.x * 0.32 + t * 0.30) * cos(p.y * 0.38 - t * 0.22)
         + 0.28 * sin(p.x * 0.71 + p.y * 0.53 - t * 0.45)
         + 0.10 * sin(p.x * 1.60 - t * 0.70) * sin(p.y * 1.30 + t * 0.50);
  }

  void main() {
    vec3 p = position;
    float h = surface(p.xz, uTime);

    // The pointer raises a soft swell in the field, ringed by ripples
    // that spread outwards, like a fingertip on water. uStir grows while
    // the pointer moves and settles back when it rests.
    float d = distance(p.xz, uPointer);
    float swell = exp(-d * d * 0.16);
    float ripple = sin(d * 2.2 - uTime * 4.2) * exp(-d * 0.32) * (1.0 - swell);
    float touch = uStir * (swell * 0.95 + ripple * 0.22);
    vGlow = uStir * swell;

    p.y = (h + touch) * mix(1.0, 0.4, uFlatten);
    vHeat = smoothstep(-0.3, 0.75, h + touch * 0.7);

    // A bright band rolls across the field from the horizon to the viewer.
    float span = ${f(NEAR_Z - FAR_Z + 8)};
    float bandZ = ${f(FAR_Z - 4)} + mod(uTime * 2.6, span);
    vScan = exp(-pow((p.z - bandZ) * 0.85, 2.0));

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float depth = -mvPosition.z;
    float size = uSize * uPixelRatio * (0.75 + aSeed * 0.5) * (1.0 + vScan * 0.7 + vGlow * 0.6) / depth;
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
  varying float vGlow;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, d);
    // Light on dark: dim slate valleys, off-white peaks, like a heatmap.
    vec3 color = mix(uLow, uMid, smoothstep(0.0, 0.6, vHeat));
    color = mix(color, uHigh, smoothstep(0.6, 1.0, vHeat));
    // The rolling band is steel blue, the page's pop colour.
    color = mix(color, uPop, max(vScan * 0.9, vGlow * 0.75));
    // Kept low so the glow stays calm rather than bright.
    float alpha = soft * vAlpha * (0.22 + vHeat * 0.48 + vScan * 0.4 + vGlow * 0.3);
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
      // Where the pointer lands on the field (x, z), and how stirred it is.
      uPointer: { value: new Vector2(0, FAR_Z) },
      uStir: { value: 0 },
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

    const pointer = { x: 0, y: 0, inside: false }
    const sway = { x: 0, y: 0 }
    const position = new Vector3()
    const target = new Vector3()

    // Pointer on the field: cast a ray from the camera onto the ground. Above
    // the horizon the ray misses, so it lands on a wall at the far edge
    // instead, and the pointer still stirs the distant ridge.
    const raycaster = new Raycaster()
    const ndc = new Vector2()
    const ground = new Plane(new Vector3(0, 1, 0), 0)
    const backWall = new Plane(new Vector3(0, 0, 1), -REACH_Z)
    const hit = new Vector3()
    const aim = new Vector2(0, FAR_Z)
    let energy = 0 // builds with pointer movement, decays at rest
    const locate = () => {
      ndc.set(pointer.x, -pointer.y)
      raycaster.setFromCamera(ndc, camera)
      const onGround = raycaster.ray.intersectPlane(ground, hit)
      if (!onGround || hit.z < REACH_Z) raycaster.ray.intersectPlane(backWall, hit)
      aim.set(hit.x, Math.max(hit.z, REACH_Z))
    }

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
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = (event.clientY / window.innerHeight) * 2 - 1
      if (pointer.inside) energy = Math.min(1, energy + Math.hypot(x - pointer.x, y - pointer.y) * 2.5)
      pointer.x = x
      pointer.y = y
      pointer.inside = true
    }
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) pointer.inside = false
    }

    const tick = (_time: number, deltaTime: number) => {
      if (!visibility?.isActive) return
      const dt = Math.min(deltaTime, 50) / 1000
      uniforms.uTime.value += dt
      sway.x += (pointer.x * 0.9 - sway.x) * 0.04
      sway.y += (-pointer.y * 0.25 - sway.y) * 0.04

      // A resting pointer keeps a gentle swell; moving it lifts more.
      energy *= Math.exp(-dt * 1.6)
      const stir = pointer.inside ? 0.45 + energy * 0.75 : 0
      uniforms.uStir.value += (stir - uniforms.uStir.value) * 0.06
      if (pointer.inside) locate()
      uniforms.uPointer.value.lerp(aim, 0.08)
      render()
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    onReady()

    if (!reducedMotion) {
      gsap.ticker.add(tick)
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('pointerout', onPointerOut)
    }

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerout', onPointerOut)
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
