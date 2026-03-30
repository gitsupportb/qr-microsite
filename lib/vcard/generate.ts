/**
 * Pure vCard 3.0 generator function.
 * Produces RFC 2426 compliant vCard strings with:
 * - CRLF line endings
 * - Proper value escaping (backslash, semicolon, comma)
 * - Line folding at 75 characters
 * - Event context notes
 *
 * No external dependencies -- pure string logic.
 */

export interface VCardInput {
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  orgName: string
  website?: string | null
  eventName?: string | null
  standNumber?: string | null
  customNote?: string | null
}

/**
 * Escape special characters per RFC 2426 Section 2.4.2.
 * Backslash MUST be escaped first to avoid double-escaping.
 */
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Fold lines longer than 75 characters per RFC 2426.
 * First segment: 75 chars max.
 * Continuation lines: CRLF + space + up to 74 chars.
 * Folds at character count (not byte count) for multi-byte UTF-8 safety.
 */
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line
  }

  const parts: string[] = []
  parts.push(line.slice(0, 75))
  let remaining = line.slice(75)

  while (remaining.length > 0) {
    parts.push(' ' + remaining.slice(0, 74))
    remaining = remaining.slice(74)
  }

  return parts.join('\r\n')
}

/**
 * Parse a full name into family and given name components.
 * Split on the last space -- family name is the last word,
 * given name is everything before it.
 * If single word, family=name, given=empty.
 */
function parseName(fullName: string): { family: string; given: string } {
  const lastSpaceIndex = fullName.lastIndexOf(' ')
  if (lastSpaceIndex === -1) {
    return { family: fullName, given: '' }
  }
  return {
    family: fullName.slice(lastSpaceIndex + 1),
    given: fullName.slice(0, lastSpaceIndex),
  }
}

/**
 * Format a date as "30 Mar 2026" (en-GB day month year).
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Generate a REV timestamp in vCard format: YYYYMMDDTHHMMSSZ
 */
function generateRev(): string {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Build the NOTE value from event context or custom note.
 */
function buildNote(input: VCardInput): string | null {
  if (input.customNote) {
    return input.customNote
  }

  if (input.eventName) {
    let note = `Met at ${input.eventName}`
    if (input.standNumber) {
      note += ` - Stand ${input.standNumber}`
    }
    note += ` - ${formatDate(new Date())}`
    return note
  }

  return null
}

/**
 * Generate a vCard 3.0 string from the given input.
 * Pure function with zero external dependencies.
 *
 * Property order: BEGIN, VERSION, N, FN, ORG, TITLE, TEL (work),
 * TEL (cell/whatsapp), EMAIL, URL, NOTE, REV, END
 */
export function generateVCard(input: VCardInput): string {
  const lines: string[] = []
  const { family, given } = parseName(input.name)

  // Required header
  lines.push('BEGIN:VCARD')
  lines.push('VERSION:3.0')

  // N and FN -- always present
  lines.push(`N:${escapeValue(family)};${escapeValue(given)};;;`)
  lines.push(`FN:${escapeValue(input.name)}`)

  // ORG -- always present
  lines.push(`ORG:${escapeValue(input.orgName)}`)

  // TITLE -- optional
  if (input.title) {
    lines.push(`TITLE:${escapeValue(input.title)}`)
  }

  // TEL -- phone and whatsapp handling
  if (input.phone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${escapeValue(input.phone)}`)
  }

  // WhatsApp as CELL type, but only if different from phone
  if (input.whatsapp && input.whatsapp !== input.phone) {
    lines.push(`TEL;TYPE=CELL:${escapeValue(input.whatsapp)}`)
  }

  // EMAIL -- optional
  if (input.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeValue(input.email)}`)
  }

  // URL -- optional
  if (input.website) {
    lines.push(`URL:${escapeValue(input.website)}`)
  }

  // NOTE -- event context or custom note
  const note = buildNote(input)
  if (note) {
    lines.push(`NOTE:${escapeValue(note)}`)
  }

  // REV -- timestamp
  lines.push(`REV:${generateRev()}`)

  // Required footer
  lines.push('END:VCARD')

  // Apply line folding and join with CRLF, plus trailing CRLF
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
