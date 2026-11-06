import { useRef, type CSSProperties } from 'react'
import { Emphasis, SectionLabel } from '../components/text'
import { services, servicesSection } from '../content'
import { useLineReveal } from '../hooks/useLineReveal'
import { gsap, MOTION_OK, useGSAP } from '../lib/gsap'
import './Services.css'

/**
 * Cards stick to the top one after another and form a stack; each card
 * shrinks and dims as the next one slides over it.
 */
export function Services() {
  const rootRef = useRef<HTMLElement>(null)
  useLineReveal(rootRef, '.services__title')

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const cards = gsap.utils.toArray<HTMLElement>('.service-card')
        cards.forEach((card, i) => {
          const next = cards[i + 1]
          if (!next) return
          gsap
            .timeline({
              scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true },
            })
            .to(card.querySelector('.service-card__inner'), { scale: 0.92, ease: 'none' }, 0)
            .to(card.querySelector('.service-card__shade'), { opacity: 0.22, ease: 'none' }, 0)
        })
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      id="services"
      ref={rootRef}
      className="services section"
      tabIndex={-1}
      aria-labelledby="services-title"
    >
      <div className="container">
        <header className="services__head">
          <div>
            <SectionLabel index="02">{servicesSection.label}</SectionLabel>
            <h2 id="services-title" className="section-title services__title">
              <Emphasis text={servicesSection.title} />
            </h2>
          </div>
        </header>

        <ol className="services__list">
          {services.map((service, i) => (
            <li key={service.title} className="service-card" style={{ '--i': i } as CSSProperties}>
              <article className="service-card__inner glass">
                <div className="service-card__top">
                  <span className="service-card__index mono">{String(i + 1).padStart(2, '0')}</span>
                  <ul className="service-card__tags" aria-label="Tools">
                    {service.tags.map((tag) => (
                      <li key={tag} className="mono">
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="service-card__body">
                  <h3 className="service-card__title">{service.title}</h3>
                  <p className="service-card__text">{service.description}</p>
                </div>
                <span className="service-card__shade" aria-hidden="true" />
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
