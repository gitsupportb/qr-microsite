import type { Json } from '@/lib/supabase/types'

interface AboutSectionProps {
  aboutContent: Json
}

/** Shape expected from aboutContentSchema in lib/schemas/business-profile.ts */
interface TextSection {
  title?: string
  content?: string
}

interface TagSection {
  title?: string
  items?: string[]
}

interface AboutContentParsed {
  about_us?: TextSection
  why_choose_us?: TextSection
  sectors_served?: TagSection
  certifications?: TagSection
  use_cases?: TagSection
}

function isNonEmpty(value: unknown): boolean {
  if (!value) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return false
}

function TextBlock({ section }: { section: TextSection | undefined }) {
  if (!section || !isNonEmpty(section.content)) return null
  return (
    <div className="space-y-1.5">
      {section.title && (
        <h3 className="text-sm font-medium text-slate-800">
          {section.title}
        </h3>
      )}
      <p className="text-sm leading-relaxed text-slate-500">
        {section.content}
      </p>
    </div>
  )
}

function TagChips({ section }: { section: TagSection | undefined }) {
  if (!section || !isNonEmpty(section.items)) return null
  return (
    <div className="space-y-2">
      {section.title && (
        <h3 className="text-sm font-medium text-slate-800">
          {section.title}
        </h3>
      )}
      <div className="flex flex-wrap gap-1.5">
        {section.items!.map((item) => (
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

export function AboutSection({ aboutContent }: AboutSectionProps) {
  // Parse defensively -- aboutContent is raw JSONB
  if (!aboutContent || typeof aboutContent !== 'object' || Array.isArray(aboutContent)) {
    return null
  }

  const content = aboutContent as unknown as AboutContentParsed

  // Check if anything has content
  const hasAboutUs = isNonEmpty(content.about_us?.content)
  const hasWhyChooseUs = isNonEmpty(content.why_choose_us?.content)
  const hasSectors = isNonEmpty(content.sectors_served?.items)
  const hasCertifications = isNonEmpty(content.certifications?.items)
  const hasUseCases = isNonEmpty(content.use_cases?.items)

  const hasAnyContent =
    hasAboutUs || hasWhyChooseUs || hasSectors || hasCertifications || hasUseCases

  // Hidden when all sections are empty (D-30)
  if (!hasAnyContent) {
    return null
  }

  return (
    <section id="about" className="px-5 sm:px-8">
      <div className="mx-auto max-w-xl py-8">
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 p-5 shadow-lg shadow-black/[0.03]">
          <p className="mb-5 text-[0.6875rem] uppercase tracking-[0.1em] text-slate-400 font-medium">
            About
          </p>

          <div className="space-y-5">
            <TextBlock section={content.about_us} />

            {hasAboutUs && hasWhyChooseUs && (
              <hr className="border-slate-200/50" />
            )}

            <TextBlock section={content.why_choose_us} />

            {(hasAboutUs || hasWhyChooseUs) && (hasSectors || hasCertifications || hasUseCases) && (
              <hr className="border-slate-200/50" />
            )}

            <TagChips section={content.sectors_served} />
            <TagChips section={content.certifications} />
            <TagChips section={content.use_cases} />
          </div>
        </div>
      </div>
    </section>
  )
}
