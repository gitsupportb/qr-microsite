interface PlaceholderSectionProps {
  id: string
  label: string
}

/**
 * Lightweight placeholder section for scroll anchor targets.
 * These will be replaced by real components in later phases:
 * - "products" -> Phase 5
 * - "catalog" -> Phase 6
 * - "lead-capture" -> Phase 7
 */
export function PlaceholderSection({ id, label }: PlaceholderSectionProps) {
  return (
    <section
      id={id}
      className="px-4 py-4 sm:px-6"
      aria-label={label}
    >
      <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground/60">
          {label} &mdash; Coming soon
        </p>
      </div>
    </section>
  )
}
