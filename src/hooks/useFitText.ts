import { useLayoutEffect, type RefObject } from 'react'

/**
 * Sizes a single line of text so it spans its parent's content box,
 * capped at a share of the viewport height so it never crowds out the
 * rest of the screen. `scale` then shrinks the fitted size, so the text
 * can span a share of the width instead. The element needs
 * `width: max-content`.
 */
export function useFitText(ref: RefObject<HTMLElement | null>, maxHeightRatio = 0.46, scale = 1) {
  useLayoutEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return

    const fit = () => {
      const style = getComputedStyle(parent)
      const available =
        parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      el.style.fontSize = '100px'
      const natural = el.offsetWidth
      if (natural === 0) return
      const size = Math.min((100 * available) / natural, window.innerHeight * maxHeightRatio) * scale
      el.style.fontSize = `${size.toFixed(2)}px`
    }

    fit()
    // Watch the text too: splitting it into letters changes its width slightly.
    const observer = new ResizeObserver(fit)
    observer.observe(parent)
    observer.observe(el)
    document.fonts?.ready.then(fit)

    return () => observer.disconnect()
  }, [ref, maxHeightRatio, scale])
}
