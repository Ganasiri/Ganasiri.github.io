import { useRef } from 'react'
import { Emphasis, SectionLabel } from '../components/text'
import { about } from '../content'
import { gsap, MOTION_OK, SplitText, useGSAP } from '../lib/gsap'
import './About.css'

/**
 * Built to be read mid-scroll: one short statement, one line of context,
 * then numbers and facts that work at a glance.
 */
export function About() {
  const rootRef = useRef<HTMLElement>(null)
  const statementRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const statement = statementRef.current
      if (!statement) return

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        // Words light up over a short stretch and are fully lit well before
        // the statement reaches the middle of the screen.
        const split = SplitText.create(statement, { type: 'words', wordsClass: 'about__word', aria: 'none' })
        gsap.fromTo(
          split.words,
          { opacity: 0.18 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: '.about__statement', start: 'top 88%', end: 'top 45%', scrub: true },
          },
        )

        // Opacity-only fades, so the triggers measure true positions.
        gsap.from('.about__summary', {
          opacity: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.about__summary', start: 'top 90%', once: true },
        })

        gsap.utils.toArray<HTMLElement>('.about__stat').forEach((stat, i) => {
          const value = stat.querySelector('.about__stat-value')
          const tl = gsap.timeline({
            delay: (i % 4) * 0.08,
            scrollTrigger: { trigger: stat, start: 'top 92%', once: true },
          })
          tl.from(stat, { opacity: 0, duration: 0.7, ease: 'power2.out' })
          if (value) {
            tl.from(value, { textContent: 0, duration: 1.4, ease: 'power2.out', snap: { textContent: 1 } }, 0)
          }
        })

        gsap.from('.about__fact', {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.about__facts', start: 'top 92%', once: true },
        })
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      id="about"
      ref={rootRef}
      className="about section"
      tabIndex={-1}
      aria-labelledby="about-title"
    >
      <div className="container">
        <SectionLabel index="01" as="h2" id="about-title">
          About me
        </SectionLabel>

        <p className="about__statement">
          <span className="visually-hidden">{about.statement.replaceAll('*', '')}</span>
          <span ref={statementRef} aria-hidden="true">
            <Emphasis text={about.statement} />
          </span>
        </p>

        <p className="about__summary">{about.summary}</p>

        <dl className="about__stats">
          {about.stats.map((stat) => (
            <div key={stat.label} className="about__stat glass">
              <dt className="about__stat-label">
                {stat.label}
                {stat.detail && <span className="about__stat-detail">{stat.detail}</span>}
              </dt>
              <dd className="about__stat-number">
                <span aria-hidden="true">
                  {stat.prefix}
                  <span className="about__stat-value">{stat.value}</span>
                  {stat.suffix}
                </span>
                <span className="visually-hidden">
                  {stat.prefix}
                  {stat.value}
                  {stat.suffix}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <dl className="about__facts">
          {about.facts.map((fact) => (
            <div key={fact.label} className="about__fact">
              <dt className="mono">{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
