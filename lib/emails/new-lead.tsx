import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Heading,
  Preview,
} from '@react-email/components'

interface NewLeadEmailProps {
  leadName: string | null
  leadEmail: string
  leadCompany: string | null
  interestType: string | null
  eventName: string | null
  pageUrl: string
  submittedAt: string
}

export function NewLeadEmail({
  leadName,
  leadEmail,
  leadCompany,
  interestType,
  eventName,
  pageUrl,
  submittedAt,
}: NewLeadEmailProps) {
  const displayName = leadName || leadEmail

  return (
    <Html>
      <Head />
      <Preview>New lead from {displayName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={heading}>New Lead Captured</Heading>
          </Section>

          <Hr style={hr} />

          <Section style={content}>
            <InfoRow label="Name" value={leadName} />
            <InfoRow label="Email" value={leadEmail} />
            <InfoRow label="Company" value={leadCompany} />
            <InfoRow label="Interest" value={interestType} />
            <InfoRow label="Event" value={eventName} />
            <InfoRow label="Page" value={pageUrl} />
            <InfoRow
              label="Submitted"
              value={new Date(submittedAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            />
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              This notification was sent because a new lead was submitted on your
              QR microsite. You can manage notification preferences in your admin
              dashboard under Lead Form Settings.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <Text style={infoRow}>
      <span style={infoLabel}>{label}:</span> {value}
    </Text>
  )
}

// Inline styles required for email client compatibility
const body = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  margin: '0' as const,
  padding: '0' as const,
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6ebf1',
  borderRadius: '6px',
  margin: '40px auto',
  maxWidth: '560px',
  padding: '0',
}

const header = {
  padding: '32px 40px 0',
}

const heading = {
  color: '#1a1a2e',
  fontSize: '24px',
  fontWeight: '600' as const,
  lineHeight: '1.3',
  margin: '0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 40px',
}

const content = {
  padding: '0 40px',
}

const infoRow = {
  color: '#3c4257',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '4px 0',
}

const infoLabel = {
  color: '#8898aa',
  fontWeight: '600' as const,
}

const footer = {
  padding: '0 40px 32px',
}

const footerText = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
}
