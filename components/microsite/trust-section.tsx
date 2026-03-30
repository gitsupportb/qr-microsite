import { Badge } from '@/components/ui/badge'
import type { Json } from '@/lib/supabase/types'

interface TrustSectionProps {
  trustContent: Json
}

/** Generic section shapes (trust_content has no formal schema yet) */
interface TextSection {
  title?: string
  content?: string
}

interface TagSection {
  title?: string
  items?: string[]
}

function isNonEmpty(value: unknown): boolean {
  if (!value) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return false
}

export function TrustSection({ trustContent }: TrustSectionProps) {
  // trust_content is raw JSONB with no schema -- render defensively
  if (!trustContent || typeof trustContent !== 'object' || Array.isArray(trustContent)) {
    return null
  }

  const content = trustContent as Record<string, unknown>

  // Check if the object has any meaningful keys
  const keys = Object.keys(content)
  if (keys.length === 0) {
    return null
  }

  // Try to render each key as either a text section or tag section
  const sections: React.ReactNode[] = []

  for (const key of keys) {
    const value = content[key]
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue

    const section = value as Record<string, unknown>

    const title = typeof section.title === 'string' ? section.title : null

    // Text section pattern: { title, content }
    if (typeof section.content === 'string' && isNonEmpty(section.content)) {
      sections.push(
        <div key={key} className="space-y-2">
          {title && (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {section.content as string}
          </p>
        </div>
      )
    }

    // Tag section pattern: { title, items[] }
    if (Array.isArray(section.items) && section.items.length > 0) {
      sections.push(
        <div key={`${key}-tags`} className="space-y-2">
          {title && (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          <div className="flex flex-wrap gap-2">
            {(section.items as string[]).map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )
    }
  }

  // Hidden when empty (D-30)
  if (sections.length === 0) {
    return null
  }

  return (
    <section id="trust" className="px-4 py-8 sm:px-6">
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">Why Trust Us</h2>
      <div className="space-y-6">{sections}</div>
    </section>
  )
}
