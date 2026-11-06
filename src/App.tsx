import { useCallback, useEffect, useState } from 'react'
import { Cursor } from './components/Cursor'
import { LiquidGlass } from './components/LiquidGlass'
import { Loader } from './components/Loader'
import { Navbar } from './components/Navbar'
import { ScrollProgress } from './components/ScrollProgress'
import { SmoothScroll } from './components/SmoothScroll'
import { ScrollTrigger } from './lib/gsap'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { Experience } from './sections/Experience'
import { Hero } from './sections/Hero'
import { Services } from './sections/Services'
import { Toolbox } from './sections/Toolbox'
import { Work } from './sections/Work'

type Phase = 'loading' | 'revealing' | 'ready'

/** Never keep visitors waiting longer than this for slow assets. */
const MAX_WAIT = 6000

/** Resolves when web fonts and the page's images have loaded. */
function whenAssetsLoad(): Promise<unknown> {
  const fonts = document.fonts?.ready ?? Promise.resolve()
  const page =
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }))
  // Keep the counter on screen long enough to read.
  const minimum = new Promise((resolve) => window.setTimeout(resolve, 900))
  return Promise.all([fonts, page, minimum])
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [assetsReady, setAssetsReady] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const ready = assetsReady && sceneReady

  // The intro is built around the top of the page, so always start there.
  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let cancelled = false
    const markReady = () => {
      if (cancelled) return
      setAssetsReady(true)
      setSceneReady(true)
    }
    whenAssetsLoad().then(() => !cancelled && setAssetsReady(true))
    const fallback = window.setTimeout(markReady, MAX_WAIT)
    return () => {
      cancelled = true
      window.clearTimeout(fallback)
    }
  }, [])

  // Fonts change text sizes, so measure every scroll animation again
  // before the curtain lifts.
  useEffect(() => {
    if (ready) ScrollTrigger.refresh()
  }, [ready])

  const handleSceneReady = useCallback(() => setSceneReady(true), [])
  const handleReveal = useCallback(() => setPhase('revealing'), [])
  const handleDone = useCallback(() => {
    setPhase('ready')
    // Honour links such as /#work once the page is unlocked.
    const target = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null
    if (target) {
      window.setTimeout(() => {
        window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY)
      }, 50)
    }
  }, [])

  return (
    <SmoothScroll locked={phase !== 'ready'}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {phase !== 'ready' && <Loader ready={ready} onReveal={handleReveal} onDone={handleDone} />}
      <Cursor />
      <LiquidGlass />
      <ScrollProgress />
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Hero play={phase !== 'loading'} onSceneReady={handleSceneReady} />
        <About />
        <Services />
        <Work />
        <Experience />
        <Toolbox />
        <Contact />
      </main>
    </SmoothScroll>
  )
}
