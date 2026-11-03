import { useMemo, useRef } from 'react'
import { Emphasis, SectionLabel } from '../components/text'
import { certifications, marquee, skills, stackSection } from '../content'
import { useLineReveal } from '../hooks/useLineReveal'
import { gsap, MOTION_OK, useGSAP } from '../lib/gsap'
import './Toolbox.css'

const ROWS = 3

/**
 * Rows of tool names slide sideways in alternating directions, driven by
 * vertical scroll, above a plain grouped list that carries the content.
 */
export function Toolbox() {
  const rootRef = useRef<HTMLElement>(null)
  useLineReveal(rootRef, '.toolbox__title')

  const rows = useMemo(
    () => Array.from({ length: ROWS }, (_, row) => marquee.filter((_, i) => i % ROWS === row)),
    [],
  )

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>('.toolbox__row-track').forEach((track, i) => {
          const leftward = i % 2 === 0
          gsap.fromTo(
            track,
            { xPercent: leftward ? 0 : -30 },
            {
              xPercent: leftward ? -30 : 0,
              ease: 'none',
              scrollTrigger: { trigger: '.toolbox__rows', start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        })
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      id="toolbox"
      ref={rootRef}
      className="toolbox section"
      tabIndex={-1}
      aria-labelledby="toolbox-title"
    >
      <div className="container toolbox__head">
        <div>
          <SectionLabel index="05">{stackSection.label}</SectionLabel>
          <h2 id="toolbox-title" className="section-title toolbox__title">
            <Emphasis text={stackSection.title} />
          </h2>
        </div>
      </div>

      <div className="toolbox__rows" aria-hidden="true">
        {rows.map((row, i) => (
          <div key={i} className="toolbox__row">
            <div className="toolbox__row-track">
              {[...row, ...row, ...row].map((tool, j) => (
                <span key={j} className="toolbox__word">
                  {tool}
                  <span className="toolbox__sep">.</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="container toolbox__groups">
        {skills.map((group) => (
          <div key={group.title} className="toolbox__group">
            <h3 className="toolbox__group-title mono">{group.title}</h3>
            <ul className="toolbox__list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="toolbox__group">
          <h3 className="toolbox__group-title mono">Certifications</h3>
          <ul className="toolbox__list">
            {certifications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
