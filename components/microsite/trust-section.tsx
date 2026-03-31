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
        <div key={key} className="space-y-1.5">
          {title && (
            <h3 className="text-sm font-medium text-slate-800">
              {title}
            </h3>
          )}
          <p className="text-sm leading-relaxed text-slate-500">
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
            <h3 className="text-sm font-medium text-slate-800">
              {title}
            </h3>
          )}
          <div className="flex flex-wrap gap-1.5">
            {(section.items as string[]).map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full bg-blue-500/8 border border-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600"
              >
                {item}
              </span>
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
    <section id="trust" className="px-5 sm:px-8">
      <div className="mx-auto max-w-xl py-8">
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 p-5 shadow-lg shadow-black/[0.03]">
          <p className="mb-5 text-[0.6875rem] uppercase tracking-[0.1em] text-slate-400 font-medium">
            Why Trust Us
          </p>
          <div className="space-y-5">{sections}</div>
        </div>
      </div>
    </section>
  )
}
