import { useLenis } from 'lenis/react'
import { useEffect, useRef, useState } from 'react'
import { MagneticLink } from '../components/MagneticLink'
import { Emphasis, RollingText, SectionLabel } from '../components/text'
import { contact, profile } from '../content'
import { useLineReveal } from '../hooks/useLineReveal'
import './Contact.css'

const YEAR = new Date().getFullYear()

export function Contact() {
  const rootRef = useRef<HTMLElement>(null)
  useLineReveal(rootRef, '.contact__title')

  return (
    <section
      id="contact"
      ref={rootRef}
      className="contact"
      tabIndex={-1}
      aria-labelledby="contact-title"
    >
      <div className="container contact__inner">
        <SectionLabel index="06">{contact.label}</SectionLabel>
        <h2 id="contact-title" className="contact__title">
          <Emphasis text={contact.title} />
        </h2>

        <div className="contact__row">
          <p className="contact__blurb">{contact.blurb}</p>
          <MagneticLink href={`mailto:${profile.email}`} className="contact__cta glass" data-cursor="Email">
            {contact.cta}
            <span aria-hidden="true">↗</span>
          </MagneticLink>
        </div>

        <div className="contact__details">
          <div className="contact__detail glass">
            <p className="contact__detail-label mono">Email</p>
            <a className="contact__email" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <CopyButton text={profile.email} />
          </div>

          {profile.links.length > 0 && (
            <div className="contact__detail glass">
              <p className="contact__detail-label mono">Elsewhere</p>
              <ul className="contact__links">
                {profile.links.map((link) => (
                  <li key={link.href}>
                    <a className="mono" href={link.href} target="_blank" rel="noreferrer">
                      <RollingText>{link.label}</RollingText>
                      <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="contact__detail glass">
            <p className="contact__detail-label mono">Based in</p>
            <p>{profile.location}</p>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Clipboard access can be blocked; the mailto link above still works.
    }
  }

  return (
    <button type="button" className="contact__copy mono" onClick={copy}>
      <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy email'}</span>
    </button>
  )
}

function Footer() {
  const lenis = useLenis()

  const backToTop = () => {
    const home = document.getElementById('home')
    const focusHome = () => home?.focus({ preventScroll: true })
    if (lenis) {
      lenis.scrollTo(0, { duration: 2, onComplete: focusHome })
    } else {
      window.scrollTo(0, 0)
      focusHome()
    }
  }

  return (
    <footer className="container">
      <div className="footer">
        <p>
          © {YEAR} {profile.name}
        </p>
        <button type="button" className="footer__top mono" onClick={backToTop}>
          <RollingText>Back to top ↑</RollingText>
        </button>
      </div>
    </footer>
  )
}
