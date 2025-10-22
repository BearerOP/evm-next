// components/ConfettiLauncher.js
import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { CreateTypes } from 'canvas-confetti'

export default function ConfettiLauncher({ play = false }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const myConfettiRef = useRef<CreateTypes | null>(null)

  useEffect(() => {
    // Create a full-screen canvas for confetti
    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.pointerEvents = 'none'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.zIndex = '9999'
    document.body.appendChild(canvas)
    canvasRef.current = canvas as unknown as HTMLCanvasElement
    myConfettiRef.current = confetti.create(canvas as HTMLCanvasElement, { resize: true, useWorker: true })

    return () => {
      myConfettiRef.current = null
      canvas.remove()
    }
  }, [])

  useEffect(() => {
    if (!play) return
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768

    const c = myConfettiRef.current
    if (!c) return

    const colors = ['#FDB913', '#FF9800', '#D32F2F', '#FFCC00']

    if (isMobile) {
      // big bottom-to-top bursts
      c({
        particleCount: 500,
        angle: 90,
        spread: 90,
        startVelocity: 100,
        origin: { x: 0.5, y: 1 },
        gravity: 1,
        scalar: 1,
        drift: 1,
        ticks: 400,
        colors,
      })
      c({
        particleCount: 400,
        angle: 75,
        spread: 70,
        startVelocity: 95,
        origin: { x: 0.2, y: 1 },
        gravity: 1,
        drift: 0.5,
        ticks: 400,
        colors,
      })
      c({
        particleCount: 400,
        angle: 105,
        spread: 70,
        startVelocity: 95,
        origin: { x: 0.8, y: 1 },
        gravity: 1,
        drift: -0.5,
        ticks: 400,
        colors,
      })
    } else {
      const end = Date.now() + 1000
      const frame = () => {
        if (Date.now() > end) return
        c({ particleCount: 5, angle: 60, spread: 80, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors })
        c({ particleCount: 5, angle: 120, spread: 80, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors })
        requestAnimationFrame(frame)
      }
      frame()
    }
  }, [play])

  return null
}
