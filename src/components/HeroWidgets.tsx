import { useEffect, useMemo, useState } from 'react'
import { experience, hero, profile, projects } from '../content'

/** Re-renders on every minute boundary. */
function useMinute() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setNow(new Date())
          schedule()
        },
        60_000 - (Date.now() % 60_000) + 50,
      )
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [])
  return now
}

/** Minutes east of UTC for a time zone at a moment, from "GMT+5:30". */
function offsetMinutes(date: Date, timeZone: string) {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT'
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name)
  if (!match) return { minutes: 0, label: 'GMT' }
  const minutes = (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0))
  return { minutes, label: name }
}

/** "3h 30m ahead of you", "1h behind you" or "Same time as you". */
function describeGap(minutes: number) {
  if (minutes === 0) return 'Same time as you'
  const total = Math.abs(minutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  const span = [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ')
  return `${span} ${minutes > 0 ? 'ahead of' : 'behind'} you`
}

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

function TimeWidget() {
  const now = useMinute()
  const { timeZone } = profile
  const city = profile.location.split(',')[0]
  const { time, offset, gap } = useMemo(() => {
    const zone = offsetMinutes(now, timeZone)
    return {
      time: new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(now),
      offset: zone.label,
      gap: describeGap(zone.minutes + now.getTimezoneOffset()),
    }
  }, [now, timeZone])

  return (
    <article className="widget glass glass-blur hero__reveal">
      <p className="widget__label mono">{hero.widgets.time}</p>
      <p className="widget__figure">
        <time dateTime={now.toISOString()}>{time}</time>
      </p>
      <p className="widget__meta">
        <span className="widget__nowrap">{city} ·</span> <span className="widget__nowrap">{offset}</span>
        <span className="widget__sub">{gap}</span>
      </p>
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

/** iOS-style glass widgets beside the hero copy, built from site content. */
export function HeroWidgets() {
  return (
    <div className="hero__widgets-track">
      <NowWidget />
      <TimeWidget />
      <ResearchWidget />
    </div>
  )
}
