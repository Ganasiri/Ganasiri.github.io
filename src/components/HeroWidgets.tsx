import { useState } from 'react'
import { about, experience, hero, projects } from '../content'

function NowWidget() {
  const current = experience[experience.length - 1]
  return (
    <article className="widget widget--wide glass glass-blur hero__reveal">
      <p className="widget__label mono">
        <span className="widget__live" aria-hidden="true" />
        {hero.widgets.now}
      </p>
      <p className="widget__title">{current.title}</p>
      <p className="widget__meta">
        {current.organisation}
        <span className="widget__sub">{current.period}</span>
      </p>
    </article>
  )
}

/**
 * A smart stack, as on the iOS home screen: the headline results take turns,
 * each held while a thin bar fills. The bar's CSS animation drives the
 * timing, so pausing it (pointer over the widget, or keyboard focus inside)
 * pauses the stack too. With reduced motion there's no bar and no rotation;
 * the dots still switch results.
 */
function ImpactWidget() {
  const stats = about.stats
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const stat = stats[index]
  const next = () => setIndex((i) => (i + 1) % stats.length)

  return (
    <article
      className={`widget widget--stack glass glass-blur hero__reveal${paused ? ' is-paused' : ''}`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="widget__label widget__label--split mono">
        <span>{hero.widgets.impact}</span>
        <span className="widget__dots">
          {stats.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={`widget__dot${i === index ? ' is-active' : ''}`}
              aria-label={`Show ${s.label}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </span>
      </div>

      {/* Keyed, so each result slides in fresh. */}
      <div key={index} className="widget__slide">
        <p className="widget__figure">
          {stat.prefix}
          {stat.value}
          {stat.suffix}
        </p>
        <p className="widget__meta">
          {stat.label}
          {stat.detail && <span className="widget__sub">{stat.detail}</span>}
        </p>
      </div>

      <span key={`timer-${index}`} className="widget__timer" aria-hidden="true" onAnimationEnd={next} />
    </article>
  )
}

function ResearchWidget() {
  // Published papers first, so the filled bars lead.
  const papers = projects
    .filter((p) => p.status)
    .sort((a, b) => Number(b.status === 'published') - Number(a.status === 'published'))
  const published = papers.filter((p) => p.status === 'published').length
  const accepted = papers.length - published
  return (
    <article className="widget glass glass-blur hero__reveal">
      <p className="widget__label mono">{hero.widgets.research}</p>
      <p className="widget__figure">
        {papers.length}
        <span className="widget__unit"> papers</span>
      </p>
      {/* One segment per paper: solid once published, outlined while accepted. */}
      <span className="widget__segments" aria-hidden="true">
        {papers.map((p) => (
          <span key={p.title} className={`widget__segment is-${p.status}`} />
        ))}
      </span>
      <p className="widget__meta">
        <span className="widget__nowrap">{published} published ·</span>{' '}
        <span className="widget__nowrap">{accepted} accepted</span>
      </p>
    </article>
  )
}

/** iOS-style glass widgets beside the hero name, built from site content. */
export function HeroWidgets() {
  return (
    <div className="hero__widgets-track">
      <NowWidget />
      <ImpactWidget />
      <ResearchWidget />
    </div>
  )
}
