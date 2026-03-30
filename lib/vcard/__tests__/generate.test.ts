import { generateVCard, VCardInput } from '@/lib/vcard/generate'

describe('generateVCard', () => {
  const fullInput: VCardInput = {
    name: 'John Smith',
    title: 'CEO',
    email: 'john@acme.com',
    phone: '+1234567890',
    whatsapp: '+0987654321',
    orgName: 'Acme Corp',
    website: 'https://acme.com',
    eventName: 'CES 2026',
    standNumber: 'A42',
    customNote: null,
  }

  const minimalInput: VCardInput = {
    name: 'Jane Doe',
    orgName: 'Test Inc',
  }

  it('produces output starting with BEGIN:VCARD and VERSION:3.0', () => {
    const result = generateVCard(fullInput)
    expect(result).toMatch(/^BEGIN:VCARD\r\nVERSION:3\.0\r\n/)
  })

  it('contains FN with full name', () => {
    const result = generateVCard(fullInput)
    expect(result).toContain('FN:John Smith')
  })

  it('contains N with family;given format', () => {
    const result = generateVCard(fullInput)
    expect(result).toContain('N:Smith;John;;;')
  })

  it('contains ORG with company name', () => {
    const result = generateVCard(fullInput)
    expect(result).toContain('ORG:Acme Corp')
  })

  it('contains TITLE when provided', () => {
    const result = generateVCard(fullInput)
    expect(result).toContain('TITLE:CEO')
  })

  it('contains TEL with WORK,VOICE type for phone', () => {
    const result = generateVCard(fullInput)
    expect(result).toContain('TEL;TYPE=WORK,VOICE:+1234567890')
  })

  it('contains EMAIL with INTERNET type', () => {
    const result = generateVCard(fullInput)
    expect(result).toContain('EMAIL;TYPE=INTERNET:john@acme.com')
  })

  it('contains URL for website', () => {
    const result = generateVCard(fullInput)
    expect(result).toContain('URL:https://acme.com')
  })

  it('contains NOTE with event context', () => {
    const result = generateVCard(fullInput)
    expect(result).toContain('Met at CES 2026 - Stand A42')
  })

  it('escapes semicolons in values', () => {
    const input: VCardInput = {
      name: 'Smith; Jones',
      orgName: 'Test',
    }
    const result = generateVCard(input)
    expect(result).toContain('FN:Smith\\; Jones')
  })

  it('escapes commas in values', () => {
    const input: VCardInput = {
      name: 'Test',
      orgName: 'A, B Corp',
    }
    const result = generateVCard(input)
    expect(result).toContain('ORG:A\\, B Corp')
  })

  it('ends with END:VCARD followed by CRLF', () => {
    const result = generateVCard(fullInput)
    expect(result).toMatch(/END:VCARD\r\n$/)
  })

  it('uses CRLF for all line endings with no bare LF', () => {
    const result = generateVCard(fullInput)
    const stripped = result.replace(/\r\n/g, '')
    expect(stripped).not.toContain('\n')
  })

  it('folds lines longer than 75 characters', () => {
    const longOrg = 'A'.repeat(100)
    const input: VCardInput = {
      name: 'Test',
      orgName: longOrg,
    }
    const result = generateVCard(input)
    expect(result).toContain('\r\n ')
  })

  it('produces valid minimal vCard with only required fields', () => {
    const result = generateVCard(minimalInput)
    expect(result).toContain('BEGIN:VCARD')
    expect(result).toContain('VERSION:3.0')
    expect(result).toContain('FN:Jane Doe')
    expect(result).toContain('N:Doe;Jane;;;')
    expect(result).toContain('ORG:Test Inc')
    expect(result).toContain('END:VCARD')
    expect(result).not.toContain('TEL')
    expect(result).not.toContain('EMAIL')
    expect(result).not.toContain('URL')
  })

  it('includes both TEL entries when whatsapp differs from phone', () => {
    const input: VCardInput = {
      name: 'Test',
      orgName: 'Test Inc',
      phone: '+111',
      whatsapp: '+222',
    }
    const result = generateVCard(input)
    expect(result).toContain('TEL;TYPE=WORK,VOICE:+111')
    expect(result).toContain('TEL;TYPE=CELL:+222')
  })

  it('includes only one TEL entry when whatsapp equals phone', () => {
    const input: VCardInput = {
      name: 'Test',
      orgName: 'Test Inc',
      phone: '+111',
      whatsapp: '+111',
    }
    const result = generateVCard(input)
    const telCount = (result.match(/TEL/g) || []).length
    expect(telCount).toBe(1)
  })

  it('uses customNote instead of event context when provided', () => {
    const input: VCardInput = {
      ...fullInput,
      customNote: 'Call me Monday',
    }
    const result = generateVCard(input)
    expect(result).toContain('Call me Monday')
    expect(result).not.toContain('Met at')
  })
})
