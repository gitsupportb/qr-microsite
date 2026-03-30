'use client'

import { useEffect, useState } from 'react'

export function EventFooter() {
  const [visitDate, setVisitDate] = useState<string | null>(null)

  useEffect(() => {
    setVisitDate(
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    )
  }, [])

  if (!visitDate) {
    return null
  }

  return (
    <p className="text-xs text-muted-foreground">
      You visited this page on {visitDate}
    </p>
  )
}
