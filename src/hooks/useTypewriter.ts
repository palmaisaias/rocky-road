import { useEffect, useRef, useState } from 'react'

export function useTypewriter(fullText: string, speed = 22, startDelay = 600) {
  const [text, setText] = useState('')
  const [isDone, setIsDone] = useState(false)
  const i = useRef(0)

  useEffect(() => {
    setText('')
    setIsDone(false)
    i.current = 0
    const timer = setTimeout(() => {
      const iv = setInterval(() => {
        i.current += 1
        setText(fullText.slice(0, i.current))
        if (i.current >= fullText.length) {
          clearInterval(iv)
          setIsDone(true)
        }
      }, speed)
    }, startDelay)
    return () => clearTimeout(timer)
  }, [fullText, speed, startDelay])

  return { text, isDone }
}