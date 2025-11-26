import { useEffect, useMemo, useState } from 'react'

function detectMobileUA(ua: string) {
  const u = ua.toLowerCase()
  if (u.includes('iphone') || u.includes('ipod')) return true
  if (u.includes('android')) return true
  if (u.includes('harmony') || u.includes('hmos') || u.includes('honor') || u.includes('huawei')) return true
  return false
}

function hasCoarsePointer() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(pointer: coarse)').matches
}

function isSmallViewport() {
  if (typeof window === 'undefined') return false
  const w = Math.min(window.innerWidth, window.outerWidth)
  const h = Math.min(window.innerHeight, window.outerHeight)
  return w <= 768 || h <= 768
}

export function useDeviceInfo() {
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true
    return window.matchMedia('(orientation: portrait)').matches
  })
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    // @ts-ignore
    return ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(orientation: portrait)')
    const handler = () => setIsPortrait(mq.matches)
    mq.addEventListener('change', handler)
    setIsPortrait(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const updateTouch = () => {
      // @ts-ignore
      setIsTouch(('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0)
    }
    updateTouch()
    window.addEventListener('resize', updateTouch)
    return () => window.removeEventListener('resize', updateTouch)
  }, [])

  const platform = useMemo(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const l = ua.toLowerCase()
    if (l.includes('iphone') || l.includes('ipod')) return 'ios'
    if (l.includes('android')) return 'android'
    if (l.includes('harmony') || l.includes('hmos') || l.includes('honor') || l.includes('huawei')) return 'harmony'
    return 'desktop'
  }, [])

  const isMobilePhone = useMemo(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    if (detectMobileUA(ua)) return true
    if (hasCoarsePointer()) return true
    if (isSmallViewport()) return true
    return false
  }, [])

  return { isMobilePhone, isPortrait, isTouch, platform }
}

