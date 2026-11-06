import { useLenis } from 'lenis/react'
import { useRef, type FocusEvent } from 'react'
import { Emphasis, SectionLabel } from '../components/text'
import { paperStatus, projects, workSection, type Project } from '../content'
import { useLineReveal } from '../hooks/useLineReveal'
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '../lib/gsap'
import './Work.css'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The section pins to the screen while vertical scrolling slides the
 * project track sideways. Each image drifts inside its frame as its card
 * crosses the screen, which gives the row some depth.
 */
export function Work() {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const lenis = useLenis()
  useLineReveal(sectionRef, '.work__title')

  useGSAP(
    () => {
      const pin = pinRef.current
      const track = trackRef.current
      if (!pin || !track) return
      const cards = gsap.utils.toArray<HTMLElement>('.work-card')

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const getDistance = () => Math.max(0, track.scrollWidth - pin.clientWidth)

        // Cached on refresh so scroll updates never read layout.
        let distance = 0
        let viewport = 0
        let centres: number[] = []
        const measure = () => {
          distance = getDistance()
          viewport = pin.clientWidth
          const origin = track.getBoundingClientRect().left
          centres = cards.map((card) => {
            const box = card.getBoundingClientRect()
            return box.left - origin + box.width / 2
          })
        }

        const update = (self: ScrollTrigger) => {
          if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`
          const focus = self.progress * distance + viewport / 2
          let nearest = 0
          centres.forEach((centre, i) => {
            if (Math.abs(centre - focus) < Math.abs(centres[nearest] - focus)) nearest = i
          })
          if (counterRef.current) counterRef.current.textContent = pad(nearest + 1)
        }

        const slide = gsap.to(track, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            pin: true,
            start: 'top top',
            // One pixel of vertical scroll moves the track one pixel sideways.
            end: () => `+=${getDistance()}`,
            scrub: true,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onRefresh: (self) => {
              measure()
              update(self)
            },
            onUpdate: update,
          },
        })
        triggerRef.current = slide.scrollTrigger ?? null
        measure()

        cards.forEach((card) => {
          const image = card.querySelector('.work-card__image')
          if (image) {
            gsap.fromTo(
              image,
              { xPercent: -8, scale: 1.2 },
              {
                xPercent: 8,
                scale: 1.2,
                ease: 'none',
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: slide,
                  start: 'left right',
                  end: 'right left',
                  scrub: true,
                },
              },
            )
          }

          gsap.from(card.querySelectorAll('.work-card__reveal'), {
            y: 32,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.06,
            scrollTrigger: {
              trigger: card,
              containerAnimation: slide,
              start: 'left 85%',
              toggleActions: 'play none none reverse',
            },
          })
        })

        return () => {
          triggerRef.current = null
        }
      })
    },
    { scope: sectionRef },
  )

  // Keyboard users tab through cards that are off screen to the side:
  // scroll to the point where the focused card sits in the middle.
  const revealCard = (event: FocusEvent<HTMLElement>) => {
    const trigger = triggerRef.current
    const track = trackRef.current
    const pin = pinRef.current
    if (!trigger || !track || !pin) return
    const length = trigger.end - trigger.start
    if (length <= 0) return
    const card = event.currentTarget
    const offset = card.getBoundingClientRect().left - track.getBoundingClientRect().left
    const progress = gsap.utils.clamp(0, 1, (offset + card.offsetWidth / 2 - pin.clientWidth / 2) / length)
    const top = trigger.start + progress * length
    if (lenis) lenis.scrollTo(top, { duration: 0.8 })
    else window.scrollTo(0, top)
  }

  return (
    <section
      id="work"
      ref={sectionRef}
      className="work"
      tabIndex={-1}
      aria-labelledby="work-title"
    >
      <div ref={pinRef} className="work__pin">
        <div ref={trackRef} className="work__track">
          <header className="work__intro">
            <SectionLabel index="03">{workSection.label}</SectionLabel>
            <h2 id="work-title" className="section-title work__title">
              <Emphasis text={workSection.title} />
            </h2>
            <p className="work__hint mono" aria-hidden="true">
              Keep scrolling <span className="work__hint-arrow">→</span>
            </p>
          </header>

          <ol className="work__list">
            {projects.map((project, i) => (
              <li key={project.title} className="work-card" onFocus={revealCard}>
                <ProjectCard project={project} index={i} />
              </li>
            ))}
          </ol>
        </div>

        <div className="work__footer mono" aria-hidden="true">
          <span className="work__count">
            <span ref={counterRef}>01</span> / {pad(projects.length)}
          </span>
          <span className="work__bar">
            <span ref={barRef} className="work__bar-fill" />
          </span>
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="work-card__inner">
      <div className="work-card__frame">
        <img
          className="work-card__image"
          src={project.image}
          alt=""
          width={1600}
          height={1000}
          loading="lazy"
          decoding="async"
        />
        {project.status && (
          <p className={`work-card__badge is-${project.status} glass glass-blur`}>
            <span className="work-card__badge-dot" aria-hidden="true" />
            {paperStatus[project.status]}
          </p>
        )}
        <p className="work-card__metric glass glass-blur">
          <strong>{project.metric.value}</strong>
          <span className="mono">{project.metric.label}</span>
        </p>
      </div>

      <div className="work-card__info">
        <div className="work-card__heading work-card__reveal">
          <span className="work-card__index mono">{pad(index + 1)}</span>
          <h3 className="work-card__title">
            {project.href ? (
              <a className="work-card__link" href={project.href} target="_blank" rel="noreferrer" data-cursor="Read">
                {project.title}
                {/* The no-break space keeps the arrow on the title's last line. */}
                <span className="work-card__arrow" aria-hidden="true">
                  {'\u00a0'}↗
                </span>
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            ) : (
              project.title
            )}
          </h3>
        </div>
        <p className="work-card__kind mono work-card__reveal">
          {project.kind} · {project.meta}
        </p>
        <p className="work-card__subtitle work-card__reveal">{project.subtitle}</p>
        <p className="work-card__summary work-card__reveal">{project.summary}</p>
        <ul className="work-card__tools work-card__reveal" aria-label="Tools">
          {project.tools.map((tool) => (
            <li key={tool} className="mono">
              {tool}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
