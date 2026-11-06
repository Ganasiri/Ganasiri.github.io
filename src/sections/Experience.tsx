import { useRef } from 'react'
import { Emphasis, SectionLabel } from '../components/text'
import { experience, experienceSection } from '../content'
import { useLineReveal } from '../hooks/useLineReveal'
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '../lib/gsap'
import './Experience.css'

/**
 * A vertical timeline: the rail fills as you scroll, each milestone lights
 * up when the fill reaches it, and the big counter on the left rolls to
 * that milestone's year.
 */
export function Experience() {
  const rootRef = useRef<HTMLElement>(null)
  const reelRef = useRef<HTMLDivElement>(null)
  useLineReveal(rootRef, '.experience__title')

  useGSAP(
    () => {
      const setActive = (index: number) => reelRef.current?.style.setProperty('--active', String(index))

      gsap.utils.toArray<HTMLElement>('.milestone').forEach((item, i) => {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 62%',
          onEnter: () => {
            item.classList.add('is-reached')
            setActive(i)
          },
          onLeaveBack: () => {
            item.classList.remove('is-reached')
            setActive(Math.max(0, i - 1))
          },
        })
      })

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          '.experience__rail-fill',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: '.experience__list', start: 'top 62%', end: 'bottom 62%', scrub: true },
          },
        )
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      id="experience"
      ref={rootRef}
      className="experience section"
      tabIndex={-1}
      aria-labelledby="experience-title"
    >
      <div className="container experience__grid">
        <div className="experience__aside">
          <SectionLabel index="04">{experienceSection.label}</SectionLabel>
          <h2 id="experience-title" className="section-title experience__title">
            <Emphasis text={experienceSection.title} />
          </h2>
          <div className="experience__reel" aria-hidden="true">
            <div ref={reelRef} className="experience__reel-track">
              {experience.map((item) => (
                <span key={item.period} className="experience__reel-year">
                  {item.marker}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="experience__timeline">
          <span className="experience__rail" aria-hidden="true">
            <span className="experience__rail-fill" />
          </span>
          <ol className="experience__list">
            {experience.map((item) => (
              <li key={item.period} className="milestone glass">
                <span className="milestone__dot" aria-hidden="true" />
                <p className="milestone__period mono">{item.period}</p>
                <h3 className="milestone__title">{item.title}</h3>
                <p className="milestone__org">{item.organisation}</p>
                <p className="milestone__text">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
