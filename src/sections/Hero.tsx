import { useLenis } from 'lenis/react'
import { lazy, Suspense, useRef, type MouseEvent } from 'react'
import { HeroWidgets } from '../components/HeroWidgets'
import { Emphasis, RollingText } from '../components/text'
import { hero, profile } from '../content'
import { useFitText } from '../hooks/useFitText'
import { useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery'
import { gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap'
import './Hero.css'

const HeroScene = lazy(() => import('../components/HeroScene'))

type Props = {
  /** Starts the intro once the loader begins to lift. */
  play: boolean
  onSceneReady: () => void
}

export function Hero({ play, onSceneReady }: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)
  const introRef = useRef<gsap.core.Timeline | null>(null)
  const reducedMotion = useReducedMotion()
  const lenis = useLenis()

  // With widgets beside it, the name spans three quarters of its column,
  // which keeps it near half the screen width. Stacked on smaller screens,
  // it takes 60% of the line.
  const twoColumn = useMediaQuery('(min-width: 1024px)')
  useFitText(nameRef, 0.46, twoColumn ? 0.75 : 0.6)

  const goToWork = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById('work')
    if (!lenis || !target) return
    event.preventDefault()
    lenis.scrollTo(target, { duration: 1.5, onComplete: () => target.focus({ preventScroll: true }) })
    history.replaceState(null, '', '#work')
  }

  useGSAP(
    () => {
      const root = rootRef.current
      const name = nameRef.current
      if (!root || !name) return

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(name, {
          type: 'chars',
          charsClass: 'hero__char',
          mask: 'chars',
          aria: 'none',
        })

        const intro = gsap.timeline({ paused: true })
        intro
          .from(split.chars, { yPercent: 120, duration: 1.4, ease: 'expo.out', stagger: 0.05 })
          .from(
            '.hero__reveal',
            { y: 24, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 },
            0.3,
          )
        introRef.current = intro

        // Cycle through focus areas, only while the hero is on screen.
        const words = gsap.utils.toArray<HTMLElement>('.hero__focus-word')
        if (words.length > 1) {
          gsap.set(words.slice(1), { y: 0, yPercent: 110 })
          const cycle = gsap.timeline({ repeat: -1, paused: true })
          words.forEach((word, i) => {
            const next = words[(i + 1) % words.length]
            cycle
              .to(word, { yPercent: -110, duration: 0.8, ease: 'power3.inOut' }, '+=2.4')
              // immediateRender: false, or the last step would hide the first word up front.
              .fromTo(
                next,
                { yPercent: 110 },
                { yPercent: 0, duration: 0.8, ease: 'power3.inOut', immediateRender: false },
                '<',
              )
          })

          let onScreen = true
          let introDone = false
          const sync = () => (onScreen && introDone ? cycle.play() : cycle.pause())
          intro.eventCallback('onComplete', () => {
            introDone = true
            sync()
          })
          ScrollTrigger.create({
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => {
              onScreen = self.isActive
              sync()
            },
          })
        }

        // Scrolling away: letters lift at different speeds and fan out.
        const scrub = { trigger: root, start: 'top top', end: 'bottom top', scrub: true }
        const offset = (i: number, total: number) => {
          const centre = (total - 1) / 2
          return centre === 0 ? 0 : (i - centre) / centre
        }
        gsap.to(split.masks, {
          yPercent: (i: number, _el: Element, all: Element[]) =>
            -(60 + (1 - Math.abs(offset(i, all.length))) * 150),
          rotation: (i: number, _el: Element, all: Element[]) => offset(i, all.length) * 9,
          ease: 'none',
          scrollTrigger: scrub,
        })
        gsap.to('.hero__name', { opacity: 0, ease: 'power1.in', scrollTrigger: scrub })
        gsap.to(['.hero__content', '.hero__footer'], {
          y: -90,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { ...scrub, end: '55% top' },
        })

        // The widgets float a little against the pointer, as if nearer the
        // viewer than the landscape behind them.
        const track = root.querySelector<HTMLElement>('.hero__widgets-track')
        if (!track || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
        const ease = { duration: 1.2, ease: 'power3.out' }
        const floatX = gsap.quickTo(track, 'x', ease)
        const floatY = gsap.quickTo(track, 'y', ease)
        const onMove = (event: PointerEvent) => {
          floatX((event.clientX / window.innerWidth - 0.5) * -22)
          floatY((event.clientY / window.innerHeight - 0.5) * -16)
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        return () => window.removeEventListener('pointermove', onMove)
      })
    },
    { scope: rootRef },
  )

  useGSAP(
    () => {
      if (play) introRef.current?.play()
    },
    { dependencies: [play] },
  )

  return (
    <section
      id="home"
      ref={rootRef}
      className="hero"
      tabIndex={-1}
      aria-labelledby="hero-title"
    >
      <Suspense fallback={null}>
        <HeroScene
          onReady={onSceneReady}
          morphTrigger="#home"
          fadeTrigger=".about__stats"
          reducedMotion={reducedMotion}
        />
      </Suspense>

      <div className="hero__inner container">
        {/* Role, name, intro and buttons on the left; widgets on the right.
            The .hero__content wrappers fade on scroll, while the
            .hero__reveal elements inside them run the intro, so the two
            animations never share an element. */}
        <div className="hero__main">
          <div className="hero__lead">
            <div className="hero__content">
              <p className="hero__role hero__reveal">
                <span className="hero__role-title">{profile.role}</span>
                <span className="hero__focus" aria-hidden="true">
                  {profile.focus.map((area) => (
                    <em key={area} className="hero__focus-word">
                      {area}
                    </em>
                  ))}
                </span>
                <span className="visually-hidden">: {profile.focus.join(', ')}</span>
              </p>
            </div>

            <h1 id="hero-title" className="hero__name">
              <span className="visually-hidden">{profile.name}</span>
              <span ref={nameRef} className="hero__name-text" aria-hidden="true">
                {profile.displayName}
              </span>
            </h1>

            <div className="hero__content hero__copy">
              <p className="hero__intro hero__reveal">
                <Emphasis text={profile.intro} />
              </p>
              <div className="hero__actions hero__reveal">
                <a href="#work" className="hero__button hero__button--primary glass" onClick={goToWork}>
                  <RollingText>{hero.primaryCta}</RollingText>
                  <span aria-hidden="true">→</span>
                </a>
                <a href={`mailto:${profile.email}`} className="hero__button glass" data-cursor="Email">
                  <RollingText>{hero.secondaryCta}</RollingText>
                </a>
              </div>
            </div>
          </div>

          <aside className="hero__content hero__widgets" aria-label="At a glance">
            <HeroWidgets />
          </aside>
        </div>

        <div className="hero__footer">
          <div className="hero__footer-inner mono hero__reveal">
            <span className="hero__scroll glass glass-blur">
              <span className="hero__scroll-line" aria-hidden="true" />
              Scroll to explore
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
