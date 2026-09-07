import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Returns true when the viewport is narrower than 768px.
 * Uses a MediaQueryList listener so it re-evaluates on window resize
 * without needing a resize event handler.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange) // cleanup on unmount
  }, [])

  return !!isMobile
}
