import { useLenis } from 'lenis/react'
import { useState, type MouseEvent } from 'react'
import { navigation, profile } from '../content'
import { ScrollTrigger, useGSAP } from '../lib/gsap'
import { RollingText } from './text'
import './Navbar.css'

export function Navbar() {
  const lenis = useLenis()
  const [active, setActive] = useState<string | null>(null)

  // Highlight the link of whichever section covers the middle of the screen.
  useGSAP(() => {
    navigation.forEach(({ id }) => {
      const section = document.getElementById(id)
      if (!section) return
      ScrollTrigger.create({
        trigger: section,
        start: 'top 50%',
        end: 'bottom 50%',
        refreshPriority: -1,
        onToggle: (self) =>
          setActive((current) => (self.isActive ? id : current === id ? null : current)),
      })
    })
  })

  const goTo = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id)
    if (!lenis || !target) return // fall back to the browser's own anchor jump
    event.preventDefault()
    lenis.scrollTo(id === 'home' ? 0 : target, {
      duration: 1.5,
      // Move keyboard focus along with the scroll position.
      onComplete: () => target.focus({ preventScroll: true }),
    })
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <header className="nav">
      {/* A floating glass bar, as in iOS 27. */}
      <div className="nav__bar glass glass-blur">
        <a
          href="#home"
          className="nav__brand"
          aria-label={`${profile.name}, back to top`}
          onClick={(event) => goTo(event, 'home')}
        >
          <span className="nav__brand-full">{profile.displayName}</span>
          <span className="nav__brand-short" aria-hidden="true">
            {profile.displayName.charAt(0)}.
          </span>
          <sup aria-hidden="true">©</sup>
        </a>

        <nav aria-label="Sections">
          <ul className="nav__links">
            {navigation.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`nav__link mono${active === id ? ' is-active' : ''}`}
                  aria-current={active === id ? 'true' : undefined}
                  onClick={(event) => goTo(event, id)}
                >
                  <RollingText>{label}</RollingText>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
