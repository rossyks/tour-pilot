import { useEffect } from 'react'

export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return

    const scrollY = window.scrollY
    const body = document.body

    body.style.top = `-${scrollY}px`
    body.style.position = 'fixed'
    body.style.width = '100%'
    body.style.overflowY = 'scroll'

    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      body.style.overflowY = ''
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])
}
