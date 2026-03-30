import { Badge } from '@/components/ui/badge'
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
    <div className="space-y-2">
      {section.title && (
        <h3 className="text-lg font-semibold">{section.title}</h3>
      )}
      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
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
        <h3 className="text-lg font-semibold">{section.title}</h3>
      )}
      <div className="flex flex-wrap gap-2">
        {section.items!.map((item) => (
          <Badge key={item} variant="secondary">
            {item}
          </Badge>
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
    <section id="about" className="px-4 py-8 sm:px-6">
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">About Us</h2>

      <div className="space-y-6">
        <TextBlock section={content.about_us} />

        {hasAboutUs && hasWhyChooseUs && (
          <hr className="border-border" />
        )}

        <TextBlock section={content.why_choose_us} />

        {(hasAboutUs || hasWhyChooseUs) && (hasSectors || hasCertifications || hasUseCases) && (
          <hr className="border-border" />
        )}

        <TagChips section={content.sectors_served} />
        <TagChips section={content.certifications} />
        <TagChips section={content.use_cases} />
      </div>
    </section>
  )
}
